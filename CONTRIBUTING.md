# Contributing to RoamingZed

Thank you for your interest in contributing to RoamingZed! This document provides guidelines and instructions for contributing.

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Welcome newcomers
- Assume good intent

---

## Getting Started

### Prerequisites

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

**Quick summary**:
- Rust toolchain with `wasm32-wasip2` target
- Node.js 18+
- Zed editor

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ytfh44/roamingzed.git
cd roamingzed

# Install MCP server dependencies
cd mcp-server
npm install
cd ..

# Build everything
cargo build --target wasm32-wasip2 --release
cd mcp-server && npm run build && cd ..
```

---

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template (if available)
3. Include:
   - RoamingZed version
   - Zed version
   - OS and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/logs

### Suggesting Features

1. Check the [roadmap](./docs/roadmap.md) for planned features
2. Open a discussion or issue
3. Describe the use case, not just the solution
4. Consider implementation complexity

### Submitting Code

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/my-feature` or `fix/my-fix`
3. **Make changes** following the code style guidelines
4. **Test** your changes
5. **Commit** with clear messages
6. **Push** to your fork
7. **Open a Pull Request**

---

## Code Style

### Rust (`src/`)

**Formatting**:
```bash
cargo fmt
```

**Linting**:
```bash
cargo clippy
```

**Guidelines**:
- Follow Rust API guidelines
- Document public functions with `///` doc comments
- Use meaningful variable names
- Prefer `Result` over `panic!`

### TypeScript (`mcp-server/src/`)

**Formatting**:
```bash
npm run lint
```

**Guidelines**:
- Use TypeScript strict mode
- Export explicit types for public APIs
- Use `interface` over `type` when possible
- Document with JSDoc comments
- Avoid `any` type

### General

- Keep functions focused and small
- Write self-documenting code
- Add comments for non-obvious logic
- Update documentation when changing APIs

---

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(mcp): add semantic search to search_notes

fix(parser): handle empty wikilinks correctly

docs(readme): update installation instructions
```

---

## Testing

### MCP Server Tests

```bash
cd mcp-server
npm test          # Run all tests
npm run test:watch # Watch mode
```

**What to test**:
- Parser: Edge cases for wikilink syntax
- Indexer: Backlink/outlink operations
- Server: Tool input validation

### Rust Extension Tests

```bash
cargo test
```

> Note: Currently limited due to WASM target constraints.

### Manual Testing

See [docs/testing.md](./docs/testing.md) for manual testing checklist.

---

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Code is formatted (`cargo fmt`, `npm run lint`)
- [ ] No new linter warnings
- [ ] Documentation updated if needed
- [ ] Changelog updated for user-facing changes

### PR Description

Include:
- What the PR does
- Why the change is needed
- How it was tested
- Screenshots (for UI changes)
- Breaking changes (if any)

### Review Process

1. Maintainers will review within 1-2 weeks
2. Address feedback in new commits (don't force-push during review)
3. Once approved, maintainer will merge
4. Your contribution will be in the next release!

---

## High-Impact Contribution Areas

Based on the [roadmap](./docs/roadmap.md):

### P0 (Critical)
- **MCP Integration**: Wire slash commands to MCP tools
- **Test Coverage**: Add unit/integration tests
- **Error Handling**: Improve error messages

### P1 (Important)
- **Parser Enhancement**: Advanced wikilink syntax
- **Search Improvement**: Full-text and semantic search
- **Performance**: Index caching and optimization

### Documentation
- Improve examples
- Add tutorials
- Translate to other languages

---

## Development Tips

### Hot Reload Workflow

```bash
# Terminal 1: Watch MCP server
cd mcp-server && npm run dev

# Terminal 2: After Rust changes
cargo build --target wasm32-wasip2 --release

# In Zed: Ctrl+Shift+P → "zed: reload extensions"
```

### Debugging MCP Server

```bash
cd mcp-server
DEBUG=* npm start
```

### Viewing Logs

- **Windows**: `%APPDATA%\Zed\logs\`
- **macOS**: `~/Library/Logs/Zed/`
- **Linux**: `~/.local/share/zed/logs/`

---

## Questions?

- Open a GitHub Discussion
- Check existing issues and discussions
- Read the [docs](./docs/) folder

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🚀
