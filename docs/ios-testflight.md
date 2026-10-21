# 时迹 iOS TestFlight 发布

## 当前状态

Android 的 GitHub Actions Debug APK 与 iPhone TestFlight 是**不同的构建渠道**。iOS 源码已经使用 Capacitor + SQLite，但任何 unsigned simulator build 都**不能安装到真机，也不能作为 TestFlight 包**。

发布前需要 Apple Developer Program（有效会员资格）、App Store Connect 中的应用条目、iOS Distribution 证书及 App Store provisioning profile。

- iOS Bundle ID: `com.eviehe.timefootprint`
- App name: `时迹`
- Repo: `EvieHe/time-footprint`
- Builds: [iOS Simulator Build](https://github.com/EvieHe/time-footprint/actions/workflows/mobile-ios-check.yml)
- Publish: [Publish iOS TestFlight](https://github.com/EvieHe/time-footprint/actions/workflows/mobile-ios-testflight.yml)

## 一次性 Apple 端准备

1. 登录 [Apple Developer](https://developer.apple.com/account/) 并确认开发者会员有效。在 Certificates, Identifiers & Profiles 中注册明确的 App ID：`com.eviehe.timefootprint`。
2. 创建 **Apple Distribution** 证书（需对应私钥；可从自己的 macOS 钥匙串导出为加密的 `.p12`）。
3. 为此 App ID 创建 **App Store Connect distribution** provisioning profile，下载 `.mobileprovision`。
4. 在 [App Store Connect](https://appstoreconnect.apple.com/) 创建 iOS App 条目，Bundle ID 必须是上面的字符串。确认你的 Apple Team ID。
5. 在 App Store Connect 的用户与访问 / 集成 / App Store Connect API 页面，创建有上传权限的 Team API Key，安全保存一次性下载的 `.p8`、Key ID 和 Issuer ID。

**不要把私钥、证书密码、API Key 内容贴到聊天、issue、GitHub 仓库或提交历史。**

## 一次性 GitHub 环境配置

在 GitHub 仓库 `Settings → Environments` 创建环境 **`testflight`**。在其 Environment secrets 中配置以下 7 个名称：

| Secret | 对应值 |
| --- | --- |
| `APPLE_TEAM_ID` | Apple 开发者团队 ID |
| `IOS_DISTRIBUTION_P12_BASE64` | Distribution p12 文件的单行 Base64 |
| `IOS_DISTRIBUTION_P12_PASSWORD` | p12 导出时设置的密码 |
| `IOS_APP_STORE_PROFILE_BASE64` | App Store provisioning profile 的单行 Base64 |
| `ASC_KEY_ID` | App Store Connect API Key ID |
| `ASC_ISSUER_ID` | API Issuer ID |
| `ASC_KEY_P8_BASE64` | API 的 `AuthKey_*.p8` 文件的单行 Base64 |

建议启用 `testflight` 环境的审批保护规则，避免意外发布。

macOS Terminal 可以在本机对文件编码，然后**只把输出填到 GitHub Secrets UI**：

```bash
base64 -i path/to/distribution.p12 | tr -d '\n'
base64 -i path/to/profile.mobileprovision | tr -d '\n'
base64 -i path/to/AuthKey_XXXXXXXXXX.p8 | tr -d '\n'
```

不要把输出贴进终端日志或聊天。

## 发布 TestFlight

1. 打开 [Publish iOS TestFlight](https://github.com/EvieHe/time-footprint/actions/workflows/mobile-ios-testflight.yml)，点击 **Run workflow** 并选择 `main`。
2. GitHub 的 macOS Runner 会编译 React 和原生 App，执行测试，导入临时签名凭据，archive、export IPA，再通过 Apple API 上传。
3. 在 [App Store Connect](https://appstoreconnect.apple.com/) → Apps → 时迹 → TestFlight 等待 Apple 处理构建。
4. 首次优先添加 **Internal Testing** 测试组和测试账号。外部用户需要走 Apple 的外部测试审核；审核通过后可通过邮箱邀请或公开链接分发。
5. 测试人员在 iPhone 安装 Apple 的 TestFlight，然后按邀请安装「时迹」。

## 当前测试边界

- iOS Simulator Build 在没有签名材料时可以验证 Xcode 编译，但**不代表已成功归档、上传或可供安装**。
- 真机仍需实际检查本地 SQLite 冷启动/恢复、锁屏背景音、暂停及恢复计时、操作反馈、横竖屏、安全区域、时间跨天与系统日期变化。
- 背景播放自然声音可能涉及 iOS Background Modes 和原生音频会话；当前的 Web Audio 不应被视为已满足锁屏持续播放的保证。
- Android 包与 iOS 包的数据本地存储相互独立，尚未实现跨设备同步。
- 更改 `com.eviehe.timefootprint` 会影响 Apple App ID、profile 和导出设置，必须同步修改配置。

官方资料：[Apple 上传构建](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)、[TestFlight 测试](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)。
