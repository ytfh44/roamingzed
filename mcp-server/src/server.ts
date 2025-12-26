/**
 * RoamingZed MCP Server
 * Model Context Protocol server providing wikilink/backlink tools for AI assistants
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import {
  buildIndex,
  getBacklinks,
  getOutlinks,
  searchNotes,
  getStats,
  exportIndex,
  type LinkIndex,
} from "./indexer.js";
import { watchWorkspace } from "./watcher.js";

// Server instance and state
let index: LinkIndex | null = null;

/**
 * Create and configure the MCP server
 */
export function createServer(workspaceRoot: string): McpServer {
  const server = new McpServer({
    name: "roamingzed",
    version: "0.1.0",
  });

  // Tool: Get backlinks for a file
  server.tool(
    "get_backlinks",
    "Get all pages that link to the specified file",
    {
      file: z.string().describe("File path or name to get backlinks for"),
    },
    async ({ file }) => {
      if (!index) {
        return {
          content: [{ type: "text", text: "Index not initialized" }],
          isError: true,
        };
      }

      const backlinks = getBacklinks(index, file);

      if (backlinks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No backlinks found for "${file}"`,
            },
          ],
        };
      }

      const result = backlinks
        .map((link) => {
          const note = index!.notes.get(link);
          return `- [[${note?.title || link}]] (${link})`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `## Backlinks to "${file}"\n\n${result}`,
          },
        ],
      };
    }
  );

  // Tool: Get outlinks from a file
  server.tool(
    "get_outlinks",
    "Get all wikilinks from the specified file",
    {
      file: z.string().describe("File path to get outlinks from"),
    },
    async ({ file }) => {
      if (!index) {
        return {
          content: [{ type: "text", text: "Index not initialized" }],
          isError: true,
        };
      }

      const outlinks = getOutlinks(index, file);

      if (outlinks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No outlinks found in "${file}"`,
            },
          ],
        };
      }

      const result = outlinks.map((link) => `- [[${link}]]`).join("\n");

      return {
        content: [
          {
            type: "text",
            text: `## Outlinks from "${file}"\n\n${result}`,
          },
        ],
      };
    }
  );

  // Tool: Search notes
  server.tool(
    "search_notes",
    "Search for notes by title or path",
    {
      query: z.string().describe("Search query"),
      limit: z.number().optional().default(10).describe("Maximum results"),
    },
    async ({ query, limit }) => {
      if (!index) {
        return {
          content: [{ type: "text", text: "Index not initialized" }],
          isError: true,
        };
      }

      const results = searchNotes(index, query, limit);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No notes found matching "${query}"`,
            },
          ],
        };
      }

      const resultText = results
        .map((note) => {
          const linkCount = note.outlinks.length;
          const backlinks = getBacklinks(index!, note.path).length;
          return `- **${note.title}** (${note.path})\n  Links: ${linkCount} out, ${backlinks} in`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `## Search Results for "${query}"\n\n${resultText}`,
          },
        ],
      };
    }
  );

  // Tool: Get graph data
  server.tool(
    "get_graph",
    "Get link graph data for visualization",
    {
      file: z
        .string()
        .optional()
        .describe("Center file (optional, uses all notes if not specified)"),
      depth: z.number().optional().default(2).describe("Graph depth"),
    },
    async ({ file, depth }) => {
      if (!index) {
        return {
          content: [{ type: "text", text: "Index not initialized" }],
          isError: true,
        };
      }

      const stats = getStats(index);
      let graphData: { nodes: string[]; edges: [string, string][] };

      if (file) {
        // Build subgraph around the specified file
        const visited = new Set<string>();
        const edges: [string, string][] = [];

        const explore = (current: string, currentDepth: number) => {
          if (currentDepth > depth || visited.has(current)) return;
          visited.add(current);

          // Outlinks
          const outlinks = getOutlinks(index!, current);
          for (const target of outlinks) {
            edges.push([current, target]);
            if (currentDepth < depth) {
              explore(target, currentDepth + 1);
            }
          }

          // Backlinks
          const backlinks = getBacklinks(index!, current);
          for (const source of backlinks) {
            edges.push([source, current]);
            if (currentDepth < depth) {
              explore(source, currentDepth + 1);
            }
          }
        };

        explore(file, 0);
        graphData = { nodes: Array.from(visited), edges };
      } else {
        // Full graph
        const nodes: string[] = [];
        const edges: [string, string][] = [];

        for (const note of index.notes.values()) {
          nodes.push(note.path);
          for (const target of note.outlinks) {
            edges.push([note.path, target]);
          }
        }

        graphData = { nodes, edges };
      }

      return {
        content: [
          {
            type: "text",
            text: `## Link Graph${file ? ` (centered on "${file}")` : ""}\n\n` +
              `Stats: ${stats.totalNotes} notes, ${stats.totalLinks} links\n\n` +
              `\`\`\`json\n${JSON.stringify(graphData, null, 2)}\n\`\`\``,
          },
        ],
      };
    }
  );

  // Tool: Read note content
  server.tool(
    "read_note",
    "Read the content of a markdown note",
    {
      file: z.string().describe("File path to read"),
    },
    async ({ file }) => {
      if (!index) {
        return {
          content: [{ type: "text", text: "Index not initialized" }],
          isError: true,
        };
      }

      try {
        const fullPath = path.join(index.root, file);
        const content = await fs.readFile(fullPath, "utf-8");
        const note = index.notes.get(file);
        const backlinks = getBacklinks(index, file);

        return {
          content: [
            {
              type: "text",
              text:
                `## ${note?.title || file}\n\n` +
                `**Path:** ${file}\n` +
                `**Outlinks:** ${note?.outlinks.length || 0}\n` +
                `**Backlinks:** ${backlinks.length}\n\n` +
                `---\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading file: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Resource: Link index
  server.resource(
    "wikilinks://index",
    "wikilinks://index",
    async () => {
      if (!index) {
        return {
          contents: [
            {
              uri: "wikilinks://index",
              mimeType: "application/json",
              text: JSON.stringify({ error: "Index not initialized" }),
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: "wikilinks://index",
            mimeType: "application/json",
            text: exportIndex(index),
          },
        ],
      };
    }
  );

  // Resource: Statistics
  server.resource(
    "wikilinks://stats",
    "wikilinks://stats",
    async () => {
      if (!index) {
        return {
          contents: [
            {
              uri: "wikilinks://stats",
              mimeType: "application/json",
              text: JSON.stringify({ error: "Index not initialized" }),
            },
          ],
        };
      }

      const stats = getStats(index);
      return {
        contents: [
          {
            uri: "wikilinks://stats",
            mimeType: "application/json",
            text: JSON.stringify({
              ...stats,
              root: index.root,
              lastUpdated: index.lastUpdated,
            }),
          },
        ],
      };
    }
  );

  return server;
}

/**
 * Initialize and start the MCP server
 */
export async function startServer(workspaceRoot: string): Promise<void> {
  console.error(`[roamingzed-mcp] Starting server for: ${workspaceRoot}`);

  // Build initial index
  console.error("[roamingzed-mcp] Building initial index...");
  index = await buildIndex(workspaceRoot);
  const stats = getStats(index);
  console.error(
    `[roamingzed-mcp] Indexed ${stats.totalNotes} notes with ${stats.totalLinks} links`
  );

  // Start file watcher
  console.error("[roamingzed-mcp] Starting file watcher...");
  watchWorkspace(index);

  // Create and start MCP server
  const server = createServer(workspaceRoot);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[roamingzed-mcp] Server started successfully");
}
