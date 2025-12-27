# RoamingZed Testing Guide

> **Version**: 0.1.0  
> **Last Updated**: 2025-12-27

This document describes the testing strategy, tools, and procedures for RoamingZed.

---

## Overview

RoamingZed has two main components requiring different testing approaches:

| Component | Language | Test Framework | Current Coverage |
|-----------|----------|----------------|------------------|
| MCP Server | TypeScript | Vitest | 🔴 None |
| Rust Extension | Rust | cargo test | 🔴 None |

---

## MCP Server Testing (`mcp-server/`)

### Setup

The project is configured with [Vitest](https://vitest.dev/):

```json
// package.json
{
  "scripts": {
    "test": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

### Running Tests

```bash
cd mcp-server

# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

### Test File Structure

```
mcp-server/
├── src/
│   ├── parser.ts
│   ├── parser.test.ts      # ← Unit tests for parser
│   ├── indexer.ts
│   ├── indexer.test.ts     # ← Unit tests for indexer
│   ├── server.ts
│   └── server.test.ts      # ← Integration tests for server
└── vitest.config.ts        # ← Test configuration (optional)
```

### Unit Tests to Write

#### Parser Tests (`parser.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { parseWikilinks, extractFileName, containsWikilinks } from './parser';

describe('parseWikilinks', () => {
  it('should parse basic wikilink', () => {
    const result = parseWikilinks('Hello [[world]] there');
    expect(result).toHaveLength(1);
    expect(result[0].target).toBe('world');
    expect(result[0].alias).toBeNull();
  });

  it('should parse wikilink with alias', () => {
    const result = parseWikilinks('See [[target|display text]]');
    expect(result[0].target).toBe('target');
    expect(result[0].alias).toBe('display text');
  });

  it('should parse multiple wikilinks', () => {
    const result = parseWikilinks('[[a]] and [[b]] and [[c]]');
    expect(result).toHaveLength(3);
  });

  it('should handle path-based links', () => {
    const result = parseWikilinks('[[folder/note]]');
    expect(result[0].target).toBe('folder/note');
  });

  it('should handle heading references', () => {
    const result = parseWikilinks('[[note#heading]]');
    expect(result[0].target).toBe('note#heading');
  });

  it('should return empty array for no links', () => {
    const result = parseWikilinks('No links here');
    expect(result).toHaveLength(0);
  });

  it('should capture position information', () => {
    const result = parseWikilinks('abc [[def]] ghi');
    expect(result[0].start).toBe(4);
    expect(result[0].end).toBe(11);
  });
});

describe('extractFileName', () => {
  it('should extract filename from path', () => {
    expect(extractFileName('folder/note')).toBe('note');
  });

  it('should remove heading reference', () => {
    expect(extractFileName('note#heading')).toBe('note');
  });

  it('should handle combined path and heading', () => {
    expect(extractFileName('folder/note#heading')).toBe('note');
  });

  it('should return simple name unchanged', () => {
    expect(extractFileName('note')).toBe('note');
  });
});

describe('containsWikilinks', () => {
  it('should return true for content with links', () => {
    expect(containsWikilinks('Has [[link]]')).toBe(true);
  });

  it('should return false for content without links', () => {
    expect(containsWikilinks('No links')).toBe(false);
  });
});
```

#### Indexer Tests (`indexer.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIndex,
  getBacklinks,
  getOutlinks,
  searchNotes,
  getStats,
} from './indexer';

describe('Indexer', () => {
  let index;

  beforeEach(() => {
    index = createIndex('/test/root');
    // Manually populate for testing
    index.notes.set('note-a.md', {
      path: 'note-a.md',
      title: 'Note A',
      outlinks: ['note-b', 'note-c'],
      hash: 'abc',
      mtime: Date.now(),
    });
    index.notes.set('note-b.md', {
      path: 'note-b.md',
      title: 'Note B',
      outlinks: ['note-a'],
      hash: 'def',
      mtime: Date.now(),
    });
    index.backlinks.set('note-b', ['note-a.md']);
    index.backlinks.set('note-c', ['note-a.md']);
    index.backlinks.set('note-a', ['note-b.md']);
  });

  describe('getBacklinks', () => {
    it('should return backlinks for existing file', () => {
      const result = getBacklinks(index, 'note-b.md');
      expect(result).toContain('note-a.md');
    });

    it('should return empty for file with no backlinks', () => {
      const result = getBacklinks(index, 'orphan.md');
      expect(result).toHaveLength(0);
    });
  });

  describe('getOutlinks', () => {
    it('should return outlinks for existing file', () => {
      const result = getOutlinks(index, 'note-a.md');
      expect(result).toContain('note-b');
      expect(result).toContain('note-c');
    });

    it('should return empty for non-existent file', () => {
      const result = getOutlinks(index, 'missing.md');
      expect(result).toHaveLength(0);
    });
  });

  describe('searchNotes', () => {
    it('should find notes by title', () => {
      const result = searchNotes(index, 'Note A');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Note A');
    });

    it('should find notes by path', () => {
      const result = searchNotes(index, 'note-b');
      expect(result).toHaveLength(1);
    });

    it('should be case insensitive', () => {
      const result = searchNotes(index, 'note a');
      expect(result).toHaveLength(1);
    });

    it('should respect limit', () => {
      const result = searchNotes(index, 'note', 1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const stats = getStats(index);
      expect(stats.totalNotes).toBe(2);
      expect(stats.totalLinks).toBe(3); // note-a has 2, note-b has 1
    });
  });
});
```

---

## Rust Extension Testing (`src/`)

### Challenges

Testing Rust WASM extensions is complex because:
- `zed_extension_api` is designed for the Zed runtime
- Mocking the API requires significant effort
- Integration testing requires Zed editor

### Current Approach

For now, focus on:
1. Ensuring the code compiles: `cargo check --target wasm32-wasip2`
2. Manual testing in Zed
3. Code review

### Future Approach

When test infrastructure is available:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run_backlinks_command() {
        // Would need mock Worktree
        let ext = RoamingZedExtension;
        let result = ext.run_backlinks_command(vec![], None);
        assert!(result.is_ok());
    }
}
```

### Running Rust Checks

```bash
# Type check
cargo check --target wasm32-wasip2

# Format check
cargo fmt --check

# Lint check
cargo clippy --target wasm32-wasip2

# Build (also validates)
cargo build --target wasm32-wasip2 --release
```

---

## Manual Testing Checklist

### Pre-Release Validation

#### Extension Installation
- [ ] `cargo build --target wasm32-wasip2 --release` succeeds
- [ ] `cd mcp-server && npm run build` succeeds
- [ ] Install via Zed: "zed: install dev extension"
- [ ] Extension appears in extension list
- [ ] No errors in Zed logs on startup

#### Slash Commands
- [ ] `/backlinks` shows help text
- [ ] `/graph` shows help text
- [ ] `/related test` shows help text with "test" query
- [ ] Invalid command shows error

#### MCP Server
- [ ] `npx roamingzed-mcp --help` shows usage
- [ ] `npx roamingzed-mcp --version` shows version
- [ ] Server starts without errors in test workspace
- [ ] File watcher detects new .md files
- [ ] File watcher detects changes to .md files
- [ ] File watcher handles deleted .md files

#### AI Context
- [ ] `@roamingzed` context available in AI panel
- [ ] AI can call `get_backlinks` tool
- [ ] AI can call `search_notes` tool
- [ ] AI can call `get_graph` tool
- [ ] AI can call `read_note` tool

### Test Workspace Setup

Create a test workspace with:

```
test-vault/
├── index.md           # Links to [[note-a]], [[note-b]]
├── note-a.md          # Links to [[note-b]]
├── note-b.md          # Links to [[note-a]]
├── orphan.md          # No links
├── folder/
│   └── nested.md      # Links to [[index]]
└── special/
    └── aliased.md     # Has [[target|alias]] links
```

### Performance Testing

For large vaults:

1. Create 1000+ markdown files with random links
2. Measure initial index time
3. Measure search response time
4. Measure memory usage
5. Document baseline metrics

---

## Continuous Integration (Future)

### Proposed GitHub Actions Workflow

```yaml
name: CI

on: [push, pull_request]

jobs:
  rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-wasip2
      - run: cargo fmt --check
      - run: cargo clippy --target wasm32-wasip2
      - run: cargo build --target wasm32-wasip2 --release

  typescript:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mcp-server
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

---

## Coverage Goals

### MCP Server

| Component | Target Coverage |
|-----------|-----------------|
| parser.ts | 90%+ |
| indexer.ts | 80%+ |
| server.ts | 70%+ |
| watcher.ts | 50%+ |

### Rust Extension

| Component | Target Coverage |
|-----------|-----------------|
| lib.rs | 60%+ (when testable) |

---

## Debugging Test Failures

### Vitest Debugging

```bash
# Run specific test file
npm test -- parser.test.ts

# Run tests matching pattern
npm test -- -t "parseWikilinks"

# Debug mode (Node.js inspector)
node --inspect-brk node_modules/.bin/vitest --test-timeout 0
```

### Viewing Test Output

```bash
# Verbose output
npm test -- --reporter=verbose

# JSON output for CI
npm test -- --reporter=json
```

---

## Related Documents

- [Development Guide](../DEVELOPMENT.md) - Setup instructions
- [Architecture](./architecture.md) - System design
- [API Reference](./api-reference.md) - API documentation
