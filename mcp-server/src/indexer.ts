/**
 * Link Indexer
 * Builds and maintains a bidirectional link index for markdown files
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { glob } from "glob";
import { createHash } from "node:crypto";
import { parseWikilinks, extractFileName, type WikiLink } from "./parser.js";

export interface NoteMetadata {
  /** File path relative to workspace root */
  path: string;
  /** File title (from filename or first heading) */
  title: string;
  /** Outgoing wikilinks */
  outlinks: string[];
  /** Content hash for incremental updates */
  hash: string;
  /** Last modified timestamp */
  mtime: number;
}

export interface LinkIndex {
  /** Workspace root path */
  root: string;
  /** Map of file path -> note metadata */
  notes: Map<string, NoteMetadata>;
  /** Map of target -> list of source files (backlinks) */
  backlinks: Map<string, string[]>;
  /** Last index update timestamp */
  lastUpdated: number;
}

export interface IndexStats {
  totalNotes: number;
  totalLinks: number;
  totalBacklinks: number;
}

/**
 * Create an empty link index
 */
export function createIndex(root: string): LinkIndex {
  return {
    root,
    notes: new Map(),
    backlinks: new Map(),
    lastUpdated: Date.now(),
  };
}

/**
 * Calculate content hash for change detection
 */
function hashContent(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

/**
 * Extract title from filename
 */
function titleFromPath(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  // Convert kebab-case to Title Case
  return basename
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Build a fresh index from all markdown files in the workspace
 */
export async function buildIndex(root: string): Promise<LinkIndex> {
  const index = createIndex(root);

  // Find all markdown files
  const files = await glob("**/*.md", {
    cwd: root,
    ignore: ["node_modules/**", ".git/**", ".obsidian/**"],
    nodir: true,
  });

  // Process each file
  await Promise.all(
    files.map(async (relativePath) => {
      await indexFile(index, relativePath);
    })
  );

  index.lastUpdated = Date.now();
  return index;
}

/**
 * Index a single file and update the index
 */
export async function indexFile(
  index: LinkIndex,
  relativePath: string
): Promise<void> {
  const fullPath = path.join(index.root, relativePath);

  try {
    const stat = await fs.stat(fullPath);
    const content = await fs.readFile(fullPath, "utf-8");
    const hash = hashContent(content);

    // Check if file has changed
    const existing = index.notes.get(relativePath);
    if (existing && existing.hash === hash) {
      return; // No changes
    }

    // Remove old backlinks if updating
    if (existing) {
      removeBacklinks(index, relativePath, existing.outlinks);
    }

    // Parse wikilinks
    const links = parseWikilinks(content);
    const outlinks = links.map((l) => extractFileName(l.target));

    // Create note metadata
    const note: NoteMetadata = {
      path: relativePath,
      title: titleFromPath(relativePath),
      outlinks,
      hash,
      mtime: stat.mtimeMs,
    };

    // Update index
    index.notes.set(relativePath, note);

    // Add new backlinks
    addBacklinks(index, relativePath, outlinks);
  } catch (error) {
    // File might have been deleted
    removeFile(index, relativePath);
  }
}

/**
 * Remove a file from the index
 */
export function removeFile(index: LinkIndex, relativePath: string): void {
  const existing = index.notes.get(relativePath);
  if (existing) {
    removeBacklinks(index, relativePath, existing.outlinks);
    index.notes.delete(relativePath);
  }
}

/**
 * Add backlinks for a source file
 */
function addBacklinks(
  index: LinkIndex,
  source: string,
  targets: string[]
): void {
  for (const target of targets) {
    const normalized = target.toLowerCase();
    const existing = index.backlinks.get(normalized) || [];
    if (!existing.includes(source)) {
      existing.push(source);
      index.backlinks.set(normalized, existing);
    }
  }
}

/**
 * Remove backlinks for a source file
 */
function removeBacklinks(
  index: LinkIndex,
  source: string,
  targets: string[]
): void {
  for (const target of targets) {
    const normalized = target.toLowerCase();
    const existing = index.backlinks.get(normalized);
    if (existing) {
      const filtered = existing.filter((s) => s !== source);
      if (filtered.length > 0) {
        index.backlinks.set(normalized, filtered);
      } else {
        index.backlinks.delete(normalized);
      }
    }
  }
}

/**
 * Get backlinks for a given file
 */
export function getBacklinks(index: LinkIndex, filePath: string): string[] {
  const basename = path.basename(filePath, path.extname(filePath));
  const normalized = basename.toLowerCase();
  return index.backlinks.get(normalized) || [];
}

/**
 * Get outlinks for a given file
 */
export function getOutlinks(index: LinkIndex, filePath: string): string[] {
  const note = index.notes.get(filePath);
  return note?.outlinks || [];
}

/**
 * Search notes by title or content
 */
export function searchNotes(
  index: LinkIndex,
  query: string,
  limit: number = 10
): NoteMetadata[] {
  const lowerQuery = query.toLowerCase();
  const results: NoteMetadata[] = [];

  for (const note of index.notes.values()) {
    if (
      note.title.toLowerCase().includes(lowerQuery) ||
      note.path.toLowerCase().includes(lowerQuery)
    ) {
      results.push(note);
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Get index statistics
 */
export function getStats(index: LinkIndex): IndexStats {
  let totalLinks = 0;
  for (const note of index.notes.values()) {
    totalLinks += note.outlinks.length;
  }

  let totalBacklinks = 0;
  for (const sources of index.backlinks.values()) {
    totalBacklinks += sources.length;
  }

  return {
    totalNotes: index.notes.size,
    totalLinks,
    totalBacklinks,
  };
}

/**
 * Export index to JSON for caching
 */
export function exportIndex(index: LinkIndex): string {
  return JSON.stringify({
    root: index.root,
    notes: Array.from(index.notes.entries()),
    backlinks: Array.from(index.backlinks.entries()),
    lastUpdated: index.lastUpdated,
  });
}

/**
 * Import index from JSON cache
 */
export function importIndex(json: string): LinkIndex {
  const data = JSON.parse(json);
  return {
    root: data.root,
    notes: new Map(data.notes),
    backlinks: new Map(data.backlinks),
    lastUpdated: data.lastUpdated,
  };
}
