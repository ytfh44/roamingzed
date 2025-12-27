# Changelog

All notable changes to RoamingZed will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Rust extension ↔ MCP server integration
- Slash command auto-completion
- Unit and integration tests
- Enhanced search capabilities

---

## [0.1.0] - 2025-12-27

### Added

#### Rust Extension (`src/lib.rs`)
- Initial Zed extension framework using `zed_extension_api` v0.7
- MCP context server launcher via `npx roamingzed-mcp`
- Slash commands:
  - `/backlinks` - Show pages linking to current file
  - `/graph` - Show link graph around current file
  - `/related <query>` - Find related notes
- Stub for `complete_slash_command_argument` (TODO)

#### MCP Server (`mcp-server/`)
- TypeScript-based Model Context Protocol server
- **Tools**:
  - `get_backlinks` - Query reverse links
  - `get_outlinks` - Query forward links
  - `search_notes` - Title/path search
  - `get_graph` - Link graph data
  - `read_note` - Read note content
- **Resources**:
  - `wikilinks://index` - Full link index
  - `wikilinks://stats` - Index statistics
- Wikilink parser supporting `[[target]]` and `[[target|alias]]`
- Bidirectional link indexer with MD5 change detection
- File watcher with chokidar (500ms debounce)
- CLI with `--workspace` and `--help` options

#### Project Infrastructure
- `extension.toml` - Zed extension manifest
- `Cargo.toml` - Rust project configuration
- `package.json` - npm configuration with vitest
- Automated install scripts:
  - `install.ps1` (Windows PowerShell)
  - `install.sh` (Linux/macOS Bash)
- Test scripts:
  - `test-mcp.ps1` (Windows)
  - `test-mcp.sh` (Unix)

#### Documentation
- `README.md` - User-facing documentation
- `DEVELOPMENT.md` - Developer setup guide
- `docs/roadmap.md` - Development roadmap
- `docs/architecture.md` - System architecture
- `docs/api-reference.md` - MCP API documentation
- `CONTRIBUTING.md` - Contribution guidelines

### Known Issues
- Slash commands return static help text instead of actual query results
- No auto-completion for `/related` command
- No persistent index cache (re-indexes on every startup)
- No test coverage

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2025-12-27 | Initial development release |

---

## Upgrade Notes

### From Pre-release to 0.1.0

This is the first versioned release. No upgrade path needed.

---

## Links

- [Repository](https://github.com/ytfh44/roamingzed)
- [Roadmap](./docs/roadmap.md)
- [Issues](https://github.com/ytfh44/roamingzed/issues)

[Unreleased]: https://github.com/ytfh44/roamingzed/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ytfh44/roamingzed/releases/tag/v0.1.0
