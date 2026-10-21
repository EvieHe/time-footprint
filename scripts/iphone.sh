#!/usr/bin/env bash
# 时迹：免费 Apple Account iPhone 真机安装准备
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
fail() { printf '\n✖ %s\n' "$1" >&2; exit 1; }
step() { printf '\n● %s\n' "$1"; }

[[ "$(uname -s)" == 'Darwin' ]] || fail '请在 Mac 上运行。'
command -v node >/dev/null 2>&1 || fail '需要 Node.js 22+：https://nodejs.org/'
command -v npm >/dev/null 2>&1 || fail '需要 npm（随 Node.js 安装）。'
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
(( NODE_MAJOR >= 22 )) || fail "当前是 Node.js $(node -v)，请更新到 22 或以上：https://nodejs.org/"
[[ -d /Applications/Xcode.app ]] || fail '未找到 Xcode。请先从 Mac App Store 安装 Xcode 26 或以上。'
if ! XCODE_VERSION="$(xcodebuild -version 2>&1)"; then
  fail "请先打开 Xcode 完成首次设置；若命令行选中 Command Line Tools，运行：sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
$XCODE_VERSION"
fi
XCODE_MAJOR="$(printf '%s\n' "$XCODE_VERSION" | awk '/^Xcode / {split($2,v,".");print v[1]}')"
[[ "$XCODE_MAJOR" =~ ^[0-9]+$ ]] || fail "无法识别 Xcode 版本：$XCODE_VERSION"
(( XCODE_MAJOR >= 26 )) || fail 'Capacitor 8 需要 Xcode 26 或以上。'

step "环境就绪：Node $(node -v) / $(printf '%s' "$XCODE_VERSION" | head -n 1)"
step '安装项目依赖（跳过桌面版原生模块构建）'
npm install --ignore-scripts --no-audit --no-fund
step '运行手机数据测试'
npm run test:mobile
step '构建手机界面'
npm run build
step '生成并同步 iOS 工程'
if [[ ! -d ios ]]; then
  npx --no-install cap add ios
elif [[ ! -d ios/App/App.xcodeproj ]]; then
  fail '检测到不完整的 ios/ 目录。请先备份排查，脚本不会删除你的 Xcode 修改。'
fi
npx --no-install cap sync ios

step '打开 Xcode'
if [[ -d ios/App/App.xcworkspace ]]; then
  open -a Xcode "$(pwd)/ios/App/App.xcworkspace"
else
  open -a Xcode "$(pwd)/ios/App/App.xcodeproj"
fi

cat <<'NEXT'
✔ Xcode 打开后，在 Mac 上完成 4 步：

1. Xcode → Settings → Accounts → +，用自己的 Apple Account 登录。
2. 选择 App 工程 → TARGETS 下的 App → Signing & Capabilities：
   勾选 Automatically manage signing；Team 选 Personal Team。
   Bundle Identifier 如果冲突，改成自己专属的唯一 ID。
3. 连接并解锁 iPhone，手机点「信任」。
   如提示开发者模式：设置 → 隐私与安全性 → 开发者模式，启用并重启。
4. Xcode 顶栏选自己的 iPhone，点击 ▶ Run；安装后手机桌面显示「时迹」。

以后更新：git pull origin main && bash scripts/iphone.sh，然后 Xcode 再点 ▶ Run。
免费 Personal Team 的描述文件通常 7 天过期，需要重新通过 Xcode 安装。
手机数据仅保存在本机，请勿删除 App 或清除应用数据。
NEXT
