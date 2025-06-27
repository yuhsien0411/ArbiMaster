#!/bin/bash

# ArbiMaster 安裝腳本
# 自動處理常見的安裝問題

echo "🚀 開始安裝 ArbiMaster..."
echo "================================"

# 檢查Node.js版本
echo "📋 檢查Node.js版本..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js 18.0.0 或更高版本"
    echo "   下載地址: https://nodejs.org/"
    exit 1
fi

# 提取版本號
NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v\([0-9]*\)\..*/\1/')
if [ $NODE_MAJOR -lt 18 ]; then
    echo "❌ Node.js 版本過低，當前版本: $NODE_VERSION"
    echo "   需要 Node.js 18.0.0 或更高版本"
    exit 1
fi

echo "✅ Node.js 版本檢查通過: $NODE_VERSION"

# 檢查npm版本
echo "📋 檢查npm版本..."
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ npm 未安裝"
    exit 1
fi

echo "✅ npm 版本: $NPM_VERSION"

# 清除舊的安裝
echo "🧹 清理舊的安裝..."
if [ -d "node_modules" ]; then
    echo "   刪除 node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "   刪除 package-lock.json..."
    rm -f package-lock.json
fi

# 清除npm緩存
echo "🧹 清除npm緩存..."
npm cache clean --force

# 安裝依賴
echo "📦 安裝依賴..."
echo "   這可能需要幾分鐘時間，請耐心等待..."

# 先安裝核心依賴
echo "   安裝核心依賴..."
npm install --no-optional

# 檢查安裝結果
if [ $? -ne 0 ]; then
    echo "❌ 依賴安裝失敗"
    echo "   嘗試使用不同的方法..."
    
    # 嘗試使用yarn
    if command -v yarn &> /dev/null; then
        echo "   嘗試使用 yarn..."
        yarn install
        if [ $? -eq 0 ]; then
            echo "✅ 使用 yarn 安裝成功"
        else
            echo "❌ yarn 安裝也失敗"
            exit 1
        fi
    else
        echo "❌ 安裝失敗，請檢查網絡連接或嘗試手動安裝"
        exit 1
    fi
else
    echo "✅ 依賴安裝成功"
fi

# 檢查關鍵依賴
echo "🔍 檢查關鍵依賴..."
MISSING_DEPS=()

if [ ! -d "node_modules/@tensorflow" ]; then
    MISSING_DEPS+=("@tensorflow/tfjs-node")
fi

if [ ! -d "node_modules/next" ]; then
    MISSING_DEPS+=("next")
fi

if [ ! -d "node_modules/react" ]; then
    MISSING_DEPS+=("react")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "⚠️  發現缺失的關鍵依賴: ${MISSING_DEPS[*]}"
    echo "   嘗試單獨安裝..."
    
    for dep in "${MISSING_DEPS[@]}"; do
        echo "   安裝 $dep..."
        npm install $dep
    done
fi

# 創建必要的目錄
echo "📁 創建必要的目錄..."
mkdir -p models
mkdir -p lib/predictors
mkdir -p lib/training
mkdir -p lib/utils

# 檢查安裝結果
echo "🔍 最終檢查..."
if [ -d "node_modules" ] && [ -f "package.json" ]; then
    echo "✅ 安裝完成！"
    echo ""
    echo "🎉 ArbiMaster 安裝成功！"
    echo "================================"
    echo "📋 下一步操作："
    echo "   1. 啟動開發服務器: npm run dev"
    echo "   2. 打開瀏覽器訪問: http://localhost:3000"
    echo "   3. 測試AI功能: node test-predictions.js"
    echo ""
    echo "📚 更多信息請查看 README.md"
else
    echo "❌ 安裝檢查失敗"
    exit 1
fi 