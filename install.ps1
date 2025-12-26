#!/usr/bin/env pwsh
# RoamingZed 快速构建和安装脚本

param(
    [switch]$SkipBuild,
    [switch]$DevMode
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 RoamingZed 构建和安装脚本" -ForegroundColor Cyan
Write-Host ""

# 检查环境
Write-Host "📋 检查环境..." -ForegroundColor Yellow

# 检查 Rust
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到 Rust。请先安装: winget install Rustlang.Rustup" -ForegroundColor Red
    exit 1
}

# 检查 wasm32-wasip2 target
$targets = rustup target list --installed
if ($targets -notmatch "wasm32-wasip2") {
    Write-Host "⚙️  添加 wasm32-wasip2 target..." -ForegroundColor Yellow
    rustup target add wasm32-wasip2
}

# 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到 Node.js。请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# 构建项目
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 构建 Rust 扩展..." -ForegroundColor Yellow
    cargo build --target wasm32-wasip2 --release
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Rust 构建失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Rust 扩展构建成功" -ForegroundColor Green
    
    # 显示 WASM 文件大小
    $wasmFile = Get-Item "target\wasm32-wasip2\release\roamingzed.wasm"
    $sizeKB = [math]::Round($wasmFile.Length / 1KB, 2)
    Write-Host "   WASM 大小: $sizeKB KB" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "🔨 构建 MCP 服务器..." -ForegroundColor Yellow
    
    # 安装依赖（如果需要）
    if (-not (Test-Path "mcp-server\node_modules")) {
        Write-Host "📦 安装 npm 依赖..." -ForegroundColor Yellow
        Push-Location mcp-server
        npm install
        Pop-Location
    }
    
    # 构建 TypeScript
    Push-Location mcp-server
    npm run build
    Pop-Location
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ MCP 服务器构建失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ MCP 服务器构建成功" -ForegroundColor Green
} else {
    Write-Host "⏭️  跳过构建步骤" -ForegroundColor Gray
}

# 安装说明
Write-Host ""
Write-Host "📝 安装到 Zed:" -ForegroundColor Cyan
Write-Host ""
Write-Host "方法 1: 通过 Zed 命令面板（推荐）" -ForegroundColor White
Write-Host "  1. 在 Zed 中按 Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "  2. 输入: zed: install dev extension" -ForegroundColor Gray
Write-Host "  3. 选择目录: $PWD" -ForegroundColor Gray
Write-Host ""

Write-Host "方法 2: 手动链接" -ForegroundColor White
$zedExtDir = "$env:APPDATA\Zed\extensions\installed\roaming-zed"
Write-Host "  运行以下命令（需要管理员权限）:" -ForegroundColor Gray
Write-Host "  New-Item -ItemType SymbolicLink -Path '$zedExtDir' -Target '$PWD'" -ForegroundColor Yellow
Write-Host ""

# 测试 MCP 服务器
Write-Host "🧪 测试 MCP 服务器:" -ForegroundColor Cyan
Write-Host "  cd mcp-server" -ForegroundColor Gray
Write-Host "  npm start" -ForegroundColor Gray
Write-Host ""

# 开发模式提示
if ($DevMode) {
    Write-Host "🔧 开发模式已启用" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "启动监听模式:" -ForegroundColor White
    Write-Host "  终端 1: cd mcp-server && npm run dev" -ForegroundColor Gray
    Write-Host "  终端 2: 手动重建 Rust (cargo build --target wasm32-wasip2 --release)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "✨ 完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📚 更多信息请查看: DEVELOPMENT.md" -ForegroundColor Cyan
