# 免费安装「时迹」到 iPhone

不需要 Apple Developer 付费会员，也不需要 TestFlight。用普通 Apple Account 配合 Xcode 的 **Personal Team**，把 App 安装到自己的 iPhone。

## 准备

- 一台 Mac，已安装 [Xcode](https://apps.apple.com/app/xcode/id497799835) **26 或更高版本**（首次打开要完成组件安装和同意协议）。
- [Node.js 22 或更新版本](https://nodejs.org/)。
- iPhone、USB 数据线，以及可以登录 Xcode 的普通 Apple Account。
- iPhone 能在 Xcode 中被识别；首次连接时选择「信任此电脑」。

## Mac 上直接运行

打开「终端」，复制以下命令：

```bash
git clone https://github.com/EvieHe/time-footprint.git
cd time-footprint
bash scripts/iphone.sh
```

脚本自动：检查 Node / Xcode → 安装前端依赖 → 运行手机数据测试 → Vite 构建 → 生成/同步 Capacitor iOS 工程 → 打开 Xcode。

**如果已经克隆过仓库**，不要重复克隆，在原仓库执行：

```bash
git pull origin main
bash scripts/iphone.sh
```

此脚本不需要管理员权限，不会替你登录 Apple，不会删除本地 iOS 工程和数据。终端里不需要输入 Apple 密码。

## Xcode 只做 4 件事

1. 顶部菜单 **Xcode → Settings → Accounts → +**，登录自己的 Apple Account，应该出现 **Personal Team**。
2. 左侧选蓝色的 **App** 工程图标 → TARGETS 下的 **App** → **Signing & Capabilities**。启用 **Automatically manage signing**，**Team** 选择自己的 **Personal Team**。如果 Bundle Identifier 报冲突，改成自己独有的 ID，例如 `com.myname.timefootprint`。
3. 连接并解锁 iPhone，手机提示时点「信任」。若 Xcode 要求开启开发者模式，去 **iPhone 设置 → 隐私与安全性 → 开发者模式**，打开后按提示重启并确认。
4. 在 Xcode 顶部设备选择器选你的 iPhone，点击左上角的 **▶ Run**（快捷键 `⌘R`）。完成后 iPhone 主屏幕会出现「时迹」。

首次安装如果显示“无法验证开发者”之类的提示，可检查 **设置 → 通用 → VPN 与设备管理** 中是否有对应信任选项；也可以先检查 Xcode 的签名报错。

## 日后更新与 7 天限制

```bash
cd time-footprint
git pull origin main
bash scripts/iphone.sh
```

然后在 Xcode 点 **▶ Run**。

Apple 免费 Personal Team 的签名描述文件一般 **7 天后失效**，需要再次用 Xcode 构建安装，**不能**用于 App Store 或 TestFlight。详情见 [Apple 官方开发者账号说明](https://developer.apple.com/help/account/basics/about-your-developer-account) 和 [设备运行指导](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices)。

## 现阶段功能与边界

- 活动记录存储在 **iPhone 本地 SQLite**。计时、暂停、恢复、结束、手动补录等核心逻辑已有自动化测试。
- **不要卸载 App 或清理应用数据**：目前没有云端自动备份或与桌面版同步。更新时尽量保持相同的 Bundle Identifier。
- 设备息屏期间的**自然声音持续播放尚未经过 iPhone 实机验证**，Web Audio 在 iOS 后台可能中断；后台状态由系统管理，不能保证持续运行页面定时器，但记录的时间戳用于恢复展示。
- GitHub CI 的 [iOS 模拟器构建](https://github.com/EvieHe/time-footprint/actions/workflows/mobile-ios-check.yml) 已成功，但**不等于你的 iPhone 上签名安装成功**。
- 目前不需要配置 App Store Connect、不需要证书导出、不需要 GitHub 发布密钥。

遇到 Xcode 错误时，记录**报错文字**即可，不要截图泄露 Apple ID、证书、签名密钥或密码。
