# RoamingZed MCP API Reference

> **Version**: 0.1.0  
> **Protocol**: Model Context Protocol (MCP)

This document provides complete reference documentation for the RoamingZed MCP server's tools and resources.

---

## Overview

The RoamingZed MCP server exposes:
- **5 Tools**: Callable functions for querying the link index
- **2 Resources**: Static data endpoints

**Server Information**:
```json
{
  "name": "roamingzed",
  "version": "0.1.0"
}
```

---

## Tools

### `get_backlinks`

Get all pages that link to the specified file.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file` | `string` | Yes | File path or basename to get backlinks for |

**Request Example**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_backlinks",
    "arguments": {
      "file": "my-note"
    }
  }
}
```

**Response Format**:
```markdown
## Backlinks to "my-note"

- [[Related Note]] (folder/related-note.md)
- [[Another Note]] (another-note.md)
```

**Error Cases**:
- Index not initialized: Returns error with `isError: true`
- No backlinks found: Returns informational message

---

### `get_outlinks`

Get all wikilinks from the specified file.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file` | `string` | Yes | File path to get outlinks from |

**Request Example**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_outlinks",
    "arguments": {
      "file": "folder/my-note.md"
    }
  }
}
```

**Response Format**:
```markdown
## Outlinks from "folder/my-note.md"

- [[target-1]]
- [[target-2]]
- [[folder/target-3]]
```

**Error Cases**:
- Index not initialized: Returns error with `isError: true`
- No outlinks found: Returns informational message

---

### `search_notes`

Search for notes by title or path.

**Parameters**:

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | `string` | Yes | - | Search query (substring match) |
| `limit` | `number` | No | `10` | Maximum number of results |

**Request Example**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_notes",
    "arguments": {
      "query": "project",
      "limit": 5
    }
  }
}
```

**Response Format**:
```markdown
## Search Results for "project"

- **Project Overview** (docs/project-overview.md)
  Links: 5 out, 3 in
- **Project Setup** (project-setup.md)
  Links: 2 out, 1 in
```

**Search Behavior**:
- Case-insensitive substring matching
- Matches against both title and file path
- Results are returned in index order (not ranked)

**Error Cases**:
- Index not initialized: Returns error with `isError: true`
- No matches: Returns informational message

---

### `get_graph`

Get link graph data for visualization.

**Parameters**:

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `file` | `string` | No | - | Center file for subgraph (omit for full graph) |
| `depth` | `number` | No | `2` | Graph exploration depth from center |

**Request Example** (subgraph):
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_graph",
    "arguments": {
      "file": "my-note.md",
      "depth": 2
    }
  }
}
```

**Request Example** (full graph):
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_graph",
    "arguments": {}
  }
}
```

**Response Format**:
```markdown
## Link Graph (centered on "my-note.md")

Stats: 42 notes, 156 links

```json
{
  "nodes": ["my-note.md", "related-1.md", "related-2.md"],
  "edges": [
    ["my-note.md", "related-1.md"],
    ["related-1.md", "related-2.md"],
    ["related-2.md", "my-note.md"]
  ]
}
```
```

**Graph Structure**:
- `nodes`: Array of file paths in the graph
- `edges`: Array of `[source, target]` tuples representing links

**Depth Behavior**:
- `depth=0`: Only the center node
- `depth=1`: Center + immediate neighbors
- `depth=2`: Center + 2 hops (default)

**Error Cases**:
- Index not initialized: Returns error with `isError: true`

---

### `read_note`

Read the content of a markdown note.

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file` | `string` | Yes | File path to read (relative to workspace) |

**Request Example**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "read_note",
    "arguments": {
      "file": "folder/my-note.md"
    }
  }
}
```

**Response Format**:
```markdown
## My Note

**Path:** folder/my-note.md
**Outlinks:** 3
**Backlinks:** 2

---

# My Note

This is the actual content of the note...

Here's a [[wikilink]] to another note.
```

**Error Cases**:
- Index not initialized: Returns error with `isError: true`
- File read error: Returns error message with details

---

## Resources

### `wikilinks://index`

Full link index in JSON format.

**URI**: `wikilinks://index`

**MIME Type**: `application/json`

**Schema**:
```typescript
{
  root: string;                    // Workspace root path
  notes: [string, NoteMetadata][]; // [path, metadata] pairs
  backlinks: [string, string[]][]; // [target, sources[]] pairs
  lastUpdated: number;             // Timestamp (ms)
}

interface NoteMetadata {
  path: string;      // Relative file path
  title: string;     // Title (from filename)
  outlinks: string[]; // Link target names
  hash: string;      // Content hash (MD5)
  mtime: number;     // Last modified (ms)
}
```

**Example Response**:
```json
{
  "root": "/home/user/notes",
  "notes": [
    ["note-a.md", {
      "path": "note-a.md",
      "title": "Note A",
      "outlinks": ["note-b", "note-c"],
      "hash": "abc123...",
      "mtime": 1703673600000
    }]
  ],
  "backlinks": [
    ["note-b", ["note-a.md"]],
    ["note-c", ["note-a.md"]]
  ],
  "lastUpdated": 1703673600000
}
```

**Use Cases**:
- Export for external visualization tools
- Backup/restore index
- Debug index state

---

### `wikilinks://stats`

Index statistics.

**URI**: `wikilinks://stats`

**MIME Type**: `application/json`

**Schema**:
```typescript
{
  totalNotes: number;     // Number of indexed notes
  totalLinks: number;     // Number of outgoing links
  totalBacklinks: number; // Number of backlink entries
  root: string;           // Workspace root path
  lastUpdated: number;    // Last update timestamp (ms)
}
```

**Example Response**:
```json
{
  "totalNotes": 42,
  "totalLinks": 156,
  "totalBacklinks": 89,
  "root": "/home/user/notes",
  "lastUpdated": 1703673600000
}
```

**Use Cases**:
- Display vault statistics
- Monitor index health
- Performance metrics

---

## Slash Commands

The Rust extension provides these slash commands that interface with the MCP server:

### `/backlinks`

Show pages linking to current file.

**Usage**: `/backlinks`

**Requires Argument**: No

**Current Behavior**: Returns help text (MCP integration pending)

**Planned Behavior**: Query `get_backlinks` for active file

---

### `/graph`

Show link graph around current file.

**Usage**: `/graph`

**Requires Argument**: No

**Current Behavior**: Returns help text (MCP integration pending)

**Planned Behavior**: Query `get_graph` centered on active file

---

### `/related`

Find related notes by link proximity.

**Usage**: `/related <query>`

**Requires Argument**: Yes

**Current Behavior**: Returns help text (MCP integration pending)

**Planned Behavior**: Query `search_notes` with provided query

---

## Error Handling

### Error Response Format

```typescript
{
  content: [{
    type: "text",
    text: "Error message here"
  }],
  isError: true
}
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| "Index not initialized" | MCP server starting up | Wait for indexing to complete |
| "Error reading file: ..." | File doesn't exist or unreadable | Check file path |
| "No backlinks found" | No pages link to target | Not an error, informational |
| "No notes found matching..." | Search returned no results | Try broader query |

---

## TypeScript Types

For consumers using TypeScript, the full type definitions:

```typescript
// Parser types
interface WikiLink {
  target: string;
  alias: string | null;
  start: number;
  end: number;
}

// Indexer types
interface NoteMetadata {
  path: string;
  title: string;
  outlinks: string[];
  hash: string;
  mtime: number;
}

interface LinkIndex {
  root: string;
  notes: Map<string, NoteMetadata>;
  backlinks: Map<string, string[]>;
  lastUpdated: number;
}

interface IndexStats {
  totalNotes: number;
  totalLinks: number;
  totalBacklinks: number;
}
```

---

## Related Documents

- [Architecture](./architecture.md) - System design
- [Roadmap](./roadmap.md) - Development plans
- [Testing](./testing.md) - Testing guide
