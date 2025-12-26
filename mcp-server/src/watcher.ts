/**
 * File Watcher
 * Watches for file changes and updates the index incrementally
 */

import chokidar from "chokidar";
import * as path from "node:path";
import { indexFile, removeFile, type LinkIndex } from "./indexer.js";

export interface WatcherOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Patterns to ignore */
  ignored?: string[];
}

const DEFAULT_OPTIONS: Required<WatcherOptions> = {
  debounceMs: 500,
  ignored: [
    "**/node_modules/**",
    "**/.git/**",
    "**/.obsidian/**",
    "**/.roamingzed/**",
  ],
};

/**
 * Start watching a workspace for file changes
 */
export function watchWorkspace(
  index: LinkIndex,
  options: WatcherOptions = {}
): chokidar.FSWatcher {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Track pending updates for debouncing
  const pending = new Map<string, NodeJS.Timeout>();

  const watcher = chokidar.watch("**/*.md", {
    cwd: index.root,
    ignored: opts.ignored,
    ignoreInitial: true,
    persistent: true,
  });

  const handleChange = async (relativePath: string) => {
    // Clear existing timeout
    const existing = pending.get(relativePath);
    if (existing) {
      clearTimeout(existing);
    }

    // Set new debounced update
    const timeout = setTimeout(async () => {
      pending.delete(relativePath);
      try {
        await indexFile(index, relativePath);
        index.lastUpdated = Date.now();
      } catch (error) {
        console.error(`Error indexing ${relativePath}:`, error);
      }
    }, opts.debounceMs);

    pending.set(relativePath, timeout);
  };

  const handleDelete = (relativePath: string) => {
    // Clear pending update if any
    const existing = pending.get(relativePath);
    if (existing) {
      clearTimeout(existing);
      pending.delete(relativePath);
    }

    removeFile(index, relativePath);
    index.lastUpdated = Date.now();
  };

  watcher.on("add", handleChange);
  watcher.on("change", handleChange);
  watcher.on("unlink", handleDelete);

  return watcher;
}
