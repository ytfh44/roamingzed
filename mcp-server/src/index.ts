/**
 * RoamingZed MCP Server
 * Main entry point
 */

export { createServer, startServer } from "./server.js";
export { parseWikilinks, type WikiLink } from "./parser.js";
export {
  buildIndex,
  getBacklinks,
  getOutlinks,
  searchNotes,
  getStats,
  type LinkIndex,
  type NoteMetadata,
} from "./indexer.js";
export { watchWorkspace } from "./watcher.js";
