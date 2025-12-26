# RoamingZed

Zed 编辑器的双向链接 AI 扩展，提供 Obsidian/Roam/Logseq 风格的 `[[wikilink]]` 支持。

## 功能

- **MCP Context Server**: 让 AI 助手可查询/遍历链接图谱
- **Slash Commands**: `/backlinks`、`/graph`、`/related`
- **可与 Markdown Oxide 共存**

## 安装

### Zed Extension

```bash
# 在 Zed 中运行命令: "zed: install dev extension"
# 选择: d:\PROJECTS\roamingzed
```

### MCP Server

```bash
cd mcp-server
npm install
npm run build
```

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
