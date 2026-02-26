# Qwerty Learner（二开版本）

本仓库是基于 [RealKai42/qwerty-learner](https://github.com/RealKai42/qwerty-learner) 的二次开发版本，目标是在保留原有打字练词核心能力的前提下，完成更产品化的桌面端体验。

## 项目定位

- 面向键盘工作者的英文输入训练与词汇记忆工具
- 保留原有「按章节练习、即时反馈、结果统计、错题回顾」主流程
- 增加桌面端应用壳（侧边栏导航）与更完整的页面体系

## 二开已完成的关键改动

- 桌面端布局升级为左侧导航 + 主内容区（`DesktopShell`）
- 侧边栏「设置」改为弹窗，并与主页设置面板统一
- 顶部导航中与侧边栏重复的入口已隐藏，避免重复操作
- 左侧 `List` 抽屉支持章节下拉切换
- 深色模式由主页开关驱动，已实现跨页面全局联动
- 新增文章模块：`/article`、`/article-gallery`
- 新增业务脚手架页面：`/login`、`/sign-up`、`/go-premium`、`/payment`、`/payment/result`、`/share/:resourceType/:token`

## 技术栈

- 前端：React 18 + TypeScript + Vite
- 状态管理：Jotai
- 样式：Tailwind CSS
- UI 组件：Headless UI + Radix UI
- 本地存储：Dexie（IndexedDB）
- 图表：ECharts
- 埋点：Mixpanel
- 可选后端能力：Supabase（见 `supabase/`）

## 快速开始

### 1. 环境要求

- Node.js 18+
- Yarn 1.x（本仓库使用 `yarn.lock`）

### 2. 安装依赖

```bash
yarn install
```

### 3. 本地开发

```bash
yarn dev
```

默认访问：`http://localhost:5173/`

### 4. 构建生产包

```bash
yarn build
```

构建产物目录：`build/`

## 常用命令

```bash
# 启动开发服务
yarn dev

# 与 dev 等价
yarn start

# 构建
yarn build

# 代码检查
yarn lint

# E2E 测试（Playwright）
yarn test:e2e
```

## 路由说明（桌面端）

- `/`：主页练习
- `/gallery`：词库
- `/analysis`：数据统计
- `/error-book`：错题本
- `/article`、`/article/:id`：文章详情
- `/article-gallery`：文章库
- `/go-premium`：会员中心
- `/settings`：设置页（当前侧边栏入口为弹窗）

扩展路由：

- `/login`、`/sign-up`
- `/payment`、`/payment/result`
- `/share/:resourceType/:token`
- `/mobile`（移动端页面）

## 目录结构（核心）

```text
src/
  components/          # 通用组件（DesktopShell、SettingsDialog 等）
  pages/
    Typing/            # 打字训练主流程
    Gallery-N/         # 词库
    Analysis/          # 数据统计
    ErrorBook/         # 错题本
    Article/           # 文章详情
    ArticleGallery/    # 文章库
    Auth/              # 登录/注册（脚手架）
    Premium/           # 会员（脚手架）
    Payment/           # 支付（脚手架）
    Share/             # 分享落地页（脚手架）
  store/               # 全局状态
  resources/           # 词库与文章资源
supabase/
  functions/           # Supabase Edge Functions（如需后端接入）
```

## 二开建议路线

1. 完成 Auth、订单、会员订阅闭环（Supabase + 支付网关）
2. 将练习进度、统计、错题记录改为云同步
3. 增加内容运营能力（词库订阅、专题文章、分享激励）

可参考：`docs/secondary-development.md`

## 致谢与协议

- 上游项目：RealKai42/qwerty-learner
- 本项目遵循仓库内 `LICENSE` 协议

如果你正在进行二开，建议在 PR 中明确记录：业务目标、变更范围、回滚方案。
