# 扫码动画（QR 签到）

一个面向活动/年会的科幻风签到系统：大屏展示二维码与实时统计，手机端提交姓名与祝福，签到后触发动画、音效与弹幕。

## 功能特性

- 双端页面：大屏二维码展示页（`/`）+ 手机签到动画页（`/animation`）
- 实时签到：WebSocket 推送签到与名单状态
- 视觉效果：视频背景、HUD 动效、流星姓名、签到弹层
- 声音反馈：背景氛围、开门、认证、能量音效
- 名单管理：签到/未签到状态、自动分页、导出未签到名单
- 统计面板：实时人数、每分钟签到、峰值等

## 技术栈

- React 18 + Vite 5
- React Router
- WebSocket（`ws`）
- QRCode 生成（`qrcode.react`）
- 科幻 UI 组件（`@arwes/*`）

## 快速开始

1) 安装依赖

```bash
npm install
```

2) 启动开发环境（包含 Vite + WebSocket）

```bash
npm run dev
```

3) 访问页面

- 大屏展示页：`http://localhost:5179/`
- 手机签到页：`http://localhost:5179/animation`

> 说明：`npm run dev` 实际执行 `node server.js`，会启动 WebSocket 服务（默认 `3001`）并拉起 Vite 开发服务（默认 `5179`）。

## 使用流程

1) 大屏打开 `/` 展示二维码与签到面板
2) 手机扫码进入 `/animation`，输入姓名与祝福提交
3) 大屏实时更新签到名单、弹层提示、弹幕与音效

## 关键配置/定制

- 签到名单：`src/assets/name.txt`，一行一个姓名
- 默认祝福语：
  - `src/pages/QRCodePage.jsx` 的 `DEFAULT_BLESSING`
  - `src/pages/AnimationPage.jsx` 的 `DEFAULT_BLESSING`
- 背景视频与音效：`public/280905_small.mp4`、`public/*.wav`、`public/*.m4a`、`public/*.mp3`
- 端口与代理：
  - WebSocket 端口：`server.js` 的 `HTTP_PORT`
  - Vite 端口与 `/ws` 代理：`vite.config.js`

## 部署方式（两种思路）

方案 A：静态资源 + 独立 WebSocket
- 做法：`npm run build` 产出 `dist/`，用任意静态服务器托管；单独运行 WebSocket 服务；用反向代理把 `/ws` 转发到 WebSocket。
- 优点：前后端解耦、可横向扩展、部署灵活
- 代价：需要额外的反向代理与服务编排

方案 B：Node 一体化服务
- 做法：用一个 Node 服务同时托管 `dist/` 并挂载 WebSocket（可在 `server.js` 基础上改造）。
- 优点：部署简单、运维成本低
- 代价：扩展性与灵活性略弱

> 当前 `server.js` 主要用于开发环境的快速启动，生产部署建议按上面思路择一落地。

## 目录结构（节选）

```
.
├── public/              # 视频与音效资源
├── src/
│   ├── pages/           # 页面：QRCodePage / AnimationPage
│   ├── assets/          # 名单与静态资源
│   ├── App.jsx
│   └── main.jsx
├── server.js            # WebSocket + Vite 启动器
├── vite.config.js       # Vite 配置与 /ws 代理
└── package.json
```

## 常见问题

- 扫码后无响应？
  - 确认 WebSocket 服务是否已启动（`npm run dev` 会自动启动）。
  - 确认浏览器控制台没有 `/ws` 连接失败信息。
- 名单未显示？
  - 检查 `src/assets/name.txt` 是否有内容且为 UTF-8 文本。

---
