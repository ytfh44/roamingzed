# RoamingZed 开发与调试指南

本文档详细说明如何在本地开发、调试和安装 RoamingZed 扩展。

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [开发工作流](#开发工作流)
- [调试方法](#调试方法)
- [常见问题](#常见问题)

---

## 环境要求

### 必需工具

1. **Rust 工具链** (用于构建 Zed 扩展)
   ```powershell
   # 安装 Rust
   winget install Rustlang.Rustup
   
   # 添加 WASM 目标
   rustup target add wasm32-wasip2
   ```

2. **Node.js 18+** (用于 MCP 服务器)
   ```powershell
   # 检查版本
   node --version  # 应该 >= 18.0.0
   npm --version
   ```

3. **Zed 编辑器**
   - 从 [zed.dev](https://zed.dev) 下载最新版本
   - 确保已启用扩展功能

---

## 快速开始

### 1. 克隆并初始化项目

```powershell
# 如果还没有克隆
git clone <your-repo-url>
cd roamingzed

# 安装 MCP 服务器依赖
cd mcp-server
npm install
cd ..
```

### 2. 构建项目

#### 方法 A: 一键构建（推荐）

```powershell
# 构建 Rust 扩展
cargo build --target wasm32-wasip2 --release

# 构建 MCP 服务器
cd mcp-server
npm run build
cd ..
```

#### 方法 B: 开发模式（自动重建）

```powershell
# 终端 1: 监听 MCP 服务器变化
cd mcp-server
npm run dev

# 终端 2: Rust 扩展需要手动重建
# (Zed 会在重新加载扩展时自动构建)
```

### 3. 在 Zed 中安装开发版扩展

#### 方法 A: 通过命令面板（推荐）

1. 在 Zed 中按 `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
2. 输入并选择: `zed: install dev extension`
3. 选择项目目录: `d:\PROJECTS\roamingzed`
4. Zed 会自动构建并安装扩展

#### 方法 B: 手动链接

```powershell
# 创建符号链接到 Zed 扩展目录
# Windows (需要管理员权限)
$ZedExtDir = "$env:APPDATA\Zed\extensions\installed\roaming-zed"
New-Item -ItemType SymbolicLink -Path $ZedExtDir -Target "d:\PROJECTS\roamingzed"
```

---

## 开发工作流

### 修改 Rust 扩展代码

1. **编辑代码**: 修改 `src/lib.rs` 或其他 Rust 文件
2. **重新构建**:
   ```powershell
   cargo build --target wasm32-wasip2 --release
   ```
3. **重新加载扩展**:
   - 在 Zed 中: `Ctrl+Shift+P` → `zed: reload extensions`
   - 或者重启 Zed

### 修改 MCP 服务器代码

1. **编辑代码**: 修改 `mcp-server/src/` 下的 TypeScript 文件
2. **自动重建** (如果运行了 `npm run dev`):
   - TypeScript 会自动重新编译
3. **手动重建**:
   ```powershell
   cd mcp-server
   npm run build
   ```
4. **重启 MCP 服务器**:
   - 在 Zed 中重新加载扩展，MCP 服务器会自动重启

### 测试 MCP 服务器（独立运行）

```powershell
cd mcp-server

# 构建
npm run build

# 直接运行（用于测试）
npm start

# 或使用 npx（模拟 Zed 调用方式）
npx roamingzed-mcp
```

---

## 调试方法

### 1. 调试 Rust 扩展

#### 查看构建错误

```powershell
# 详细编译输出
cargo build --target wasm32-wasip2 --release --verbose
```

#### 添加日志输出

在 `src/lib.rs` 中使用 `eprintln!` 宏：

```rust
eprintln!("Debug: command name = {}", command.name);
```

日志会输出到 Zed 的开发者控制台。

#### 查看 Zed 日志

- **Windows**: `%APPDATA%\Zed\logs\`
- **macOS**: `~/Library/Logs/Zed/`
- **Linux**: `~/.local/share/zed/logs/`

### 2. 调试 MCP 服务器

#### 添加日志

在 TypeScript 代码中使用 `console.error()`:

```typescript
console.error('[DEBUG] Indexing file:', filePath);
```

#### 查看 MCP 服务器输出

MCP 服务器的 stderr 输出会显示在 Zed 的日志中。

#### 独立调试

```powershell
cd mcp-server

# 设置调试环境变量
$env:DEBUG = "*"

# 运行服务器
npm start

# 手动测试（需要发送 JSON-RPC 消息）
```

#### 使用 Node.js 调试器

```powershell
# 在 package.json 中添加调试脚本
# "debug": "node --inspect dist/cli.js"

npm run build
npm run debug

# 然后在 Chrome 中打开: chrome://inspect
```

### 3. 测试 Slash 命令

1. 在 Zed 中打开一个 Markdown 文件
2. 在 AI 面板中输入:
   - `/backlinks`
   - `/graph`
   - `/related test query`
3. 检查输出是否正确

### 4. 测试 MCP Context Server

1. 确保扩展已安装并加载
2. 在 AI 面板中输入: `@roamingzed`
3. 应该能看到 RoamingZed 上下文服务器
4. 尝试查询: `@roamingzed show me all wikilinks`

---

## 常见问题

### Q1: 构建失败 - "target 'wasm32-wasip2' not found"

**解决方案**:
```powershell
rustup target add wasm32-wasip2
```

### Q2: MCP 服务器无法启动

**检查清单**:
1. Node.js 版本 >= 18:
   ```powershell
   node --version
   ```
2. 依赖已安装:
   ```powershell
   cd mcp-server
   npm install
   ```
3. 已构建:
   ```powershell
   npm run build
   ```
4. 检查 `dist/cli.js` 是否存在

### Q3: Zed 找不到扩展

**解决方案**:
1. 确认 `extension.toml` 中的 `id` 与目录名匹配
2. 重新安装开发版扩展:
   - `Ctrl+Shift+P` → `zed: install dev extension`
3. 检查 Zed 扩展目录:
   ```powershell
   ls "$env:APPDATA\Zed\extensions\installed\"
   ```

### Q4: Slash 命令不工作

**检查清单**:
1. 扩展是否已加载:
   - `Ctrl+Shift+P` → `zed: extensions`
2. 重新加载扩展:
   - `Ctrl+Shift+P` → `zed: reload extensions`
3. 检查 `extension.toml` 中的 slash_commands 配置

### Q5: MCP 服务器连接失败

**调试步骤**:
1. 检查 Zed 日志中的错误信息
2. 手动测试 MCP 服务器:
   ```powershell
   cd mcp-server
   npm start
   ```
3. 确认 `npx roamingzed-mcp` 可以运行:
   ```powershell
   npx roamingzed-mcp
   ```

### Q6: 修改代码后没有生效

**解决方案**:
1. 重新构建:
   ```powershell
   # Rust 扩展
   cargo build --target wasm32-wasip2 --release
   
   # MCP 服务器
   cd mcp-server && npm run build
   ```
2. 重新加载扩展:
   - `Ctrl+Shift+P` → `zed: reload extensions`
3. 如果还不行，重启 Zed

---

## 发布检查清单

在发布到 Zed 扩展市场之前:

- [ ] 运行 Rust 测试: `cargo test`
- [ ] 运行 TypeScript 测试: `cd mcp-server && npm test`
- [ ] 运行 linter: `cd mcp-server && npm run lint`
- [ ] 更新版本号:
  - `Cargo.toml`
  - `extension.toml`
  - `mcp-server/package.json`
- [ ] 更新 `README.md` 和 `CHANGELOG.md`
- [ ] 测试所有 slash 命令
- [ ] 测试 MCP 上下文服务器
- [ ] 构建 release 版本:
  ```powershell
  cargo build --target wasm32-wasip2 --release
  cd mcp-server && npm run build
  ```

---

## 有用的命令

```powershell
# 清理构建产物
cargo clean
cd mcp-server && rm -r dist, node_modules

# 检查 Rust 代码格式
cargo fmt --check

# 检查 Rust 代码质量
cargo clippy

# 查看 WASM 文件大小
ls -lh target/wasm32-wasip2/release/*.wasm

# 查看 Zed 扩展列表
# 在 Zed 中: Ctrl+Shift+P → "zed: extensions"

# 卸载开发版扩展
# 在 Zed 中: Ctrl+Shift+P → "zed: uninstall dev extension"
```

---

## 参考资源

- [Zed Extension API 文档](https://zed.dev/docs/extensions)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Rust WASM 指南](https://rustwasm.github.io/docs/book/)
- [项目 README](./README.md)

---

**祝开发愉快！** 🚀

如有问题，请在 GitHub Issues 中提出。
