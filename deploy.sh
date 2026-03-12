#!/bin/bash
# 温差猜词游戏 - 测试部署脚本

echo "🎮 温差猜词游戏 v2.4 测试部署"
echo "================================"

PROJECT_DIR="/Users/xuming/.openclaw/workspace/workspace-jinhua/temp-guess-wx"

cd "$PROJECT_DIR"

echo ""
echo "📁 项目文件检查:"
echo "----------------"

# 检查关键文件
files=("game.js" "game.json" "project.config.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        echo "  ✅ $file (${size} bytes)"
    else
        echo "  ❌ $file (缺失)"
    fi
done

echo ""
echo "🔍 代码版本检查:"
echo "----------------"
VERSION=$(grep -o "v2\.[0-9]" game.js | head -1)
echo "  当前版本: $VERSION"

echo ""
echo "📋 修改摘要:"
echo "----------------"
echo "  1. ✅ 字号调小 (20px→16px, 16px→14px等)"
echo "  2. ✅ 历史记录对齐修复 (统一X坐标)"

echo ""
echo "🚀 部署准备完成!"
echo ""
echo "下一步操作:"
echo "  1. 打开微信开发者工具"
echo "  2. 导入项目: $PROJECT_DIR"
echo "  3. 点击'预览'生成二维码"
echo "  4. 使用手机微信扫描二维码测试"
echo ""
echo "================================"
