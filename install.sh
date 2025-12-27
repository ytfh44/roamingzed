#!/usr/bin/env bash
# RoamingZed 快速构建和安装脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 参数解析
SKIP_BUILD=false
DEV_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dev-mode)
            DEV_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🚀 RoamingZed 构建和安装脚本${NC}"
echo ""

# 检查环境
echo -e "${YELLOW}📋 检查环境...${NC}"

# 检查 Rust
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}❌ 未找到 Rust。请先安装: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${NC}"
    exit 1
fi

# 检查 wasm32-wasip2 target
if ! rustup target list --installed | grep -q "wasm32-wasip2"; then
    echo -e "${YELLOW}⚙️  添加 wasm32-wasip2 target...${NC}"
    rustup target add wasm32-wasip2
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未找到 Node.js。请先安装 Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# 构建项目
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo -e "${YELLOW}🔨 构建 Rust 扩展...${NC}"
    cargo build --target wasm32-wasip2 --release
    
    echo -e "${GREEN}✅ Rust 扩展构建成功${NC}"
    
    # 显示 WASM 文件大小
    WASM_FILE="target/wasm32-wasip2/release/roamingzed.wasm"
    if [ -f "$WASM_FILE" ]; then
        SIZE_BYTES=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE" 2>/dev/null)
        SIZE_KB=$(echo "scale=2; $SIZE_BYTES / 1024" | bc)
        echo -e "${GRAY}   WASM 大小: ${SIZE_KB} KB${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}🔨 构建 MCP 服务器...${NC}"
    
    # 安装依赖（如果需要）
    if [ ! -d "mcp-server/node_modules" ]; then
        echo -e "${YELLOW}📦 安装 npm 依赖...${NC}"
        cd mcp-server
        npm install
        cd ..
    fi
    
    # 构建 TypeScript
    cd mcp-server
    npm run build
    cd ..
    
    echo -e "${GREEN}✅ MCP 服务器构建成功${NC}"
else
    echo -e "${GRAY}⏭️  跳过构建步骤${NC}"
fi

# 安装说明
echo ""
echo -e "${CYAN}📝 安装到 Zed:${NC}"
echo ""
echo -e "${NC}方法 1: 通过 Zed 命令面板（推荐）${NC}"
echo -e "${GRAY}  1. 在 Zed 中按 Ctrl+Shift+P (Linux) 或 Cmd+Shift+P (macOS)${NC}"
echo -e "${GRAY}  2. 输入: zed: install dev extension${NC}"
echo -e "${GRAY}  3. 选择目录: $(pwd)${NC}"
echo ""

echo -e "${NC}方法 2: 手动链接${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    ZED_EXT_DIR="$HOME/Library/Application Support/Zed/extensions/installed/roaming-zed"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    ZED_EXT_DIR="$HOME/.local/share/zed/extensions/installed/roaming-zed"
else
    ZED_EXT_DIR="~/.local/share/zed/extensions/installed/roaming-zed"
fi

echo -e "${GRAY}  运行以下命令:${NC}"
echo -e "${YELLOW}  ln -s $(pwd) '$ZED_EXT_DIR'${NC}"
echo ""

# 测试 MCP 服务器
echo -e "${CYAN}🧪 测试 MCP 服务器:${NC}"
echo -e "${GRAY}  cd mcp-server${NC}"
echo -e "${GRAY}  npm start${NC}"
echo ""

# 开发模式提示
if [ "$DEV_MODE" = true ]; then
    echo -e "${MAGENTA}🔧 开发模式已启用${NC}"
    echo ""
    echo -e "${NC}启动监听模式:${NC}"
    echo -e "${GRAY}  终端 1: cd mcp-server && npm run dev${NC}"
    echo -e "${GRAY}  终端 2: 手动重建 Rust (cargo build --target wasm32-wasip2 --release)${NC}"
    echo ""
fi

echo -e "${GREEN}✨ 完成！${NC}"
echo ""
echo -e "${CYAN}📚 更多信息请查看: DEVELOPMENT.md${NC}"
