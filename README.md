# RoamingZed

Zed 编辑器的双向链接 AI 扩展，提供 Obsidian/Roam/Logseq 风格的 `[[wikilink]]` 支持。

## 功能

- **MCP Context Server**: 让 AI 助手可查询/遍历链接图谱
- **Slash Commands**: `/backlinks`、`/graph`、`/related`
- **可与 Markdown Oxide 共存**

## 快速开始

### 自动安装（推荐）

```powershell
# 克隆项目
git clone https://github.com/ytfh44/roamingzed.git
cd roamingzed

# 运行安装脚本 (Windows)
.\install.ps1

# 或者 (Linux/macOS)
./install.sh
```

### 手动安装

#### 1. 构建 Rust 扩展

```powershell
# 添加 WASM 目标（首次）
rustup target add wasm32-wasip2

# 构建
cargo build --target wasm32-wasip2 --release
```

#### 2. 构建 MCP Server

```powershell
cd mcp-server
npm install
npm run build
```

#### 3. 在 Zed 中安装

1. 在 Zed 中按 `Ctrl+Shift+P`
2. 输入: `zed: install dev extension`
3. 选择项目目录

**详细的开发和调试指南请查看: [DEVELOPMENT.md](./DEVELOPMENT.md)**

## 使用

1. 在 Zed AI 面板中使用 `@roamingzed` 上下文
2. 使用 slash 命令:
   - `/backlinks` - 显示链接到当前文件的页面
   - `/graph` - 显示链接图谱
   - `/related <query>` - 查找相关笔记

## 开发

```bash
# 构建扩展
cargo build --target wasm32-wasip2 --release

# 构建 MCP Server
cd mcp-server && npm run build
```

## License

MIT
