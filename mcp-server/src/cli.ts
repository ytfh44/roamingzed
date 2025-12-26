#!/usr/bin/env node
/**
 * RoamingZed MCP CLI
 * Command-line interface for the MCP server
 */

import * as path from "node:path";
import { startServer } from "./server.js";

// Parse command line arguments
const args = process.argv.slice(2);
let workspace = process.cwd();

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--workspace" || args[i] === "-w") {
    workspace = args[i + 1] || workspace;
    i++;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
RoamingZed MCP Server
Bidirectional wikilink support for AI assistants

Usage:
  roamingzed-mcp [options]

Options:
  -w, --workspace <path>  Workspace root directory (default: current directory)
  -h, --help              Show this help message
  -v, --version           Show version

Examples:
  roamingzed-mcp
  roamingzed-mcp --workspace /path/to/notes
`);
    process.exit(0);
  } else if (args[i] === "--version" || args[i] === "-v") {
    console.log("0.1.0");
    process.exit(0);
  }
}

// Resolve workspace path
workspace = path.resolve(workspace);

// Start the server
startServer(workspace).catch((error) => {
  console.error("[roamingzed-mcp] Fatal error:", error);
  process.exit(1);
});
