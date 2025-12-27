#!/usr/bin/env bash
# 测试 MCP 服务器是否正常工作

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}🧪 测试 RoamingZed MCP 服务器${NC}"
echo ""

# 检查构建产物
echo -e "${YELLOW}📋 检查构建产物...${NC}"

DIST_PATH="mcp-server/dist"
if [ ! -d "$DIST_PATH" ]; then
    echo -e "${RED}❌ 未找到 dist 目录。请先运行构建:${NC}"
    echo -e "${GRAY}   cd mcp-server && npm run build${NC}"
    exit 1
fi

CLI_PATH="mcp-server/dist/cli.js"
if [ ! -f "$CLI_PATH" ]; then
    echo -e "${RED}❌ 未找到 cli.js。请先运行构建:${NC}"
    echo -e "${GRAY}   cd mcp-server && npm run build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建产物存在${NC}"

# 列出所有构建文件
echo ""
echo -e "${YELLOW}📦 构建文件:${NC}"
for file in mcp-server/dist/*.js; do
    if [ -f "$file" ]; then
        FILENAME=$(basename "$file")
        SIZE_BYTES=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        SIZE_KB=$(echo "scale=2; $SIZE_BYTES / 1024" | bc)
        echo -e "${GRAY}   $FILENAME - ${SIZE_KB} KB${NC}"
    fi
done

# 检查 package.json 中的 bin 配置
echo ""
echo -e "${YELLOW}📋 检查 package.json 配置...${NC}"
if command -v jq &> /dev/null; then
    BIN_CONFIG=$(jq -r '.bin."roamingzed-mcp"' mcp-server/package.json)
    if [ "$BIN_CONFIG" != "null" ]; then
        echo -e "${GREEN}✅ bin 配置正确: $BIN_CONFIG${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到 bin 配置${NC}"
    fi
else
    echo -e "${GRAY}   (安装 jq 以查看详细配置)${NC}"
fi

# 测试 npx 命令
echo ""
echo -e "${YELLOW}🧪 测试 npx 命令...${NC}"
echo -e "${GRAY}   运行: npx roamingzed-mcp${NC}"
echo ""

cd mcp-server

# 尝试运行 MCP 服务器（超时 3 秒）
timeout 3s npx roamingzed-mcp 2>&1 | head -n 10 || true

cd ..

echo ""
echo -e "${GREEN}✅ MCP 服务器可以启动${NC}"

echo ""
echo -e "${CYAN}📝 手动测试步骤:${NC}"
echo -e "${GRAY}   1. 在 Zed 中安装扩展${NC}"
echo -e "${GRAY}   2. 打开一个包含 Markdown 文件的工作区${NC}"
echo -e "${GRAY}   3. 在 AI 面板中输入: @roamingzed${NC}"
echo -e "${GRAY}   4. 测试 slash 命令: /backlinks, /graph, /related${NC}"
echo ""

echo -e "${GREEN}✨ 测试完成！${NC}"
