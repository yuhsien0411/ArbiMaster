@echo off
chcp 65001 >nul
echo 🚀 開始安裝 ArbiMaster...
echo ================================

REM 檢查Node.js版本
echo 📋 檢查Node.js版本...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安裝，請先安裝 Node.js 18.0.0 或更高版本
    echo    下載地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 版本檢查通過: %NODE_VERSION%

REM 檢查npm版本
echo 📋 檢查npm版本...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安裝
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm 版本: %NPM_VERSION%

REM 清除舊的安裝
echo 🧹 清理舊的安裝...
if exist node_modules (
    echo    刪除 node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo    刪除 package-lock.json...
    del package-lock.json
)

REM 清除npm緩存
echo 🧹 清除npm緩存...
npm cache clean --force

REM 安裝依賴
echo 📦 安裝依賴...
echo    這可能需要幾分鐘時間，請耐心等待...

REM 安裝核心依賴
echo    安裝核心依賴...
npm install --no-optional

REM 檢查安裝結果
if %errorlevel% neq 0 (
    echo ❌ 依賴安裝失敗
    echo    嘗試使用不同的方法...
    
    REM 嘗試使用yarn
    yarn --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo    嘗試使用 yarn...
        yarn install
        if %errorlevel% equ 0 (
            echo ✅ 使用 yarn 安裝成功
        ) else (
            echo ❌ yarn 安裝也失敗
            pause
            exit /b 1
        )
    ) else (
        echo ❌ 安裝失敗，請檢查網絡連接或嘗試手動安裝
        pause
        exit /b 1
    )
) else (
    echo ✅ 依賴安裝成功
)

REM 檢查關鍵依賴
echo 🔍 檢查關鍵依賴...
set MISSING_DEPS=

if not exist "node_modules\@tensorflow" (
    set MISSING_DEPS=@tensorflow/tfjs-node
)

if not exist "node_modules\next" (
    if defined MISSING_DEPS (
        set MISSING_DEPS=%MISSING_DEPS% next
    ) else (
        set MISSING_DEPS=next
    )
)

if not exist "node_modules\react" (
    if defined MISSING_DEPS (
        set MISSING_DEPS=%MISSING_DEPS% react
    ) else (
        set MISSING_DEPS=react
    )
)

if defined MISSING_DEPS (
    echo ⚠️  發現缺失的關鍵依賴: %MISSING_DEPS%
    echo    嘗試單獨安裝...
    
    for %%d in (%MISSING_DEPS%) do (
        echo    安裝 %%d...
        npm install %%d
    )
)

REM 創建必要的目錄
echo 📁 創建必要的目錄...
if not exist models mkdir models
if not exist lib\predictors mkdir lib\predictors
if not exist lib\training mkdir lib\training
if not exist lib\utils mkdir lib\utils

REM 檢查安裝結果
echo 🔍 最終檢查...
if exist node_modules if exist package.json (
    echo ✅ 安裝完成！
    echo.
    echo 🎉 ArbiMaster 安裝成功！
    echo ================================
    echo 📋 下一步操作：
    echo    1. 啟動開發服務器: npm run dev
    echo    2. 打開瀏覽器訪問: http://localhost:3000
    echo    3. 測試AI功能: node test-predictions.js
    echo.
    echo 📚 更多信息請查看 README.md
) else (
    echo ❌ 安裝檢查失敗
    pause
    exit /b 1
)

pause 