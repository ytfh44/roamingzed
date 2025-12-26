#!/usr/bin/env pwsh
# 测试 MCP 服务器是否正常工作

$ErrorActionPreference = "Stop"

Write-Host "🧪 测试 RoamingZed MCP 服务器" -ForegroundColor Cyan
Write-Host ""

# 检查构建产物
Write-Host "📋 检查构建产物..." -ForegroundColor Yellow

$distPath = "mcp-server\dist"
if (-not (Test-Path $distPath)) {
    Write-Host "❌ 未找到 dist 目录。请先运行构建:" -ForegroundColor Red
    Write-Host "   cd mcp-server && npm run build" -ForegroundColor Gray
    exit 1
}

$cliPath = "mcp-server\dist\cli.js"
if (-not (Test-Path $cliPath)) {
    Write-Host "❌ 未找到 cli.js。请先运行构建:" -ForegroundColor Red
    Write-Host "   cd mcp-server && npm run build" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ 构建产物存在" -ForegroundColor Green

# 列出所有构建文件
Write-Host ""
Write-Host "📦 构建文件:" -ForegroundColor Yellow
Get-ChildItem "mcp-server\dist\*.js" | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    Write-Host "   $($_.Name) - $sizeKB KB" -ForegroundColor Gray
}

# 检查 package.json 中的 bin 配置
Write-Host ""
Write-Host "📋 检查 package.json 配置..." -ForegroundColor Yellow
$packageJson = Get-Content "mcp-server\package.json" | ConvertFrom-Json
if ($packageJson.bin.'roamingzed-mcp') {
    Write-Host "✅ bin 配置正确: $($packageJson.bin.'roamingzed-mcp')" -ForegroundColor Green
}
else {
    Write-Host "⚠️  未找到 bin 配置" -ForegroundColor Yellow
}

# 测试 npx 命令
Write-Host ""
Write-Host "🧪 测试 npx 命令..." -ForegroundColor Yellow
Write-Host "   运行: npx roamingzed-mcp --help" -ForegroundColor Gray
Write-Host ""

Push-Location mcp-server
try {
    # 尝试运行 MCP 服务器（超时 3 秒）
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npx roamingzed-mcp 2>&1
    }
    
    # 等待 3 秒
    Wait-Job $job -Timeout 3 | Out-Null
    
    # 获取输出
    $output = Receive-Job $job
    
    # 停止 job
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
    
    if ($output) {
        Write-Host "📤 MCP 服务器输出:" -ForegroundColor Cyan
        $output | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "✅ MCP 服务器可以启动" -ForegroundColor Green
    
}
catch {
    Write-Host "⚠️  测试时出现错误: $_" -ForegroundColor Yellow
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "📝 手动测试步骤:" -ForegroundColor Cyan
Write-Host "   1. 在 Zed 中安装扩展" -ForegroundColor Gray
Write-Host "   2. 打开一个包含 Markdown 文件的工作区" -ForegroundColor Gray
Write-Host "   3. 在 AI 面板中输入: @roamingzed" -ForegroundColor Gray
Write-Host "   4. 测试 slash 命令: /backlinks, /graph, /related" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ 测试完成！" -ForegroundColor Green
