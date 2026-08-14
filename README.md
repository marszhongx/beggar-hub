# 🥣 丐帮 (Beggar Hub)

> **天下英雄，尽入吾彀中。** —— 打狗棒在手，Token 全都有。

一个管理多个公益站（API Provider）的 API Key、监控站点状态的纯前端 Web 应用。数据全部保存在浏览器本地（localStorage），无需后端，可部署到 Vercel。

## 🧭 功能模块（丐帮黑话）

| 模块 | 图标 | 说明 |
|------|------|------|
| 聚义厅 | ⚔️ | 总览仪表盘 |
| 分舵 | 🏯 | Provider（公益站）+ 令牌（API Key）管理 |
| 探子来报 | 🕵️ | 各 Provider 状态监控（实测对话接口 + 延迟） |
| 传功 | 🧘 | 配置导入导出（JSON） |

## ✨ 特性

- **Provider 模型**：公益站 = Provider，令牌（API Key）嵌套在 Provider 下。
- **令牌类型**：创建时选择 `OpenAI 兼容` 或 `OpenAI Response`，决定探子测哪个对话接口。
- **多模型探测**：一个令牌可登记多个模型（逗号分隔），探子逐个发最小对话请求测试。
- **行内编辑**：字段始终是输入框，操作列始终有「保存/丢弃」，无编辑态切换；新建用虚线卡片/行区分。
- **探子来报**：用 API Key 实测 `/v1/chat/completions` 或 `/v1/responses`，报告连通性与延迟。

## 🚀 快速开始

```bash
npm install
npm run dev      # 本地开发
npm run build    # 类型检查 + 构建到 dist/
npm run preview  # 预览构建产物
```

## ☁️ 部署到 Vercel

```bash
npm i -g vercel
vercel
```

或直接在 Vercel 控制台导入本仓库，框架选 **Vite**，构建命令 `npm run build`，输出目录 `dist`。

## 📁 目录结构

```
src/
├── components/   # 公共组件（如 Table）
├── pages/        # 页面（Dashboard / Providers / Probe / Transfer）
├── api.ts        # 探子请求逻辑
├── store.ts      # Zustand store + localStorage 持久化
├── types.ts      # 领域类型
├── styles.css    # 全局样式（CSS 变量统一间距）
├── App.tsx       # 布局 + Tab 路由
└── main.tsx
```

## ⚠️ 免责声明

> 本工具仅为技术研究与自动化管理之目的，不提供任何 API 密钥，不代购、不转售任何服务。用户需自行配置已拥有的密钥，风险自担。

- 所有密钥仅保存在你自己的浏览器 localStorage 中，不上传任何服务器。
- 探子为**纯浏览器直连**各公益站接口，需站点开启 CORS 才能工作。
- 请遵守各公益站的使用条款，合理用量，勿滥用。

## 🛠 技术栈

- Vite + React + TypeScript
- Zustand（状态管理，localStorage 持久化）
- 纯前端，无后端依赖

## 📄 License

MIT
