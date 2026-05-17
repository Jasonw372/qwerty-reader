# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **维护要求**：开发过程中如果改动了影响以下内容的代码（store 拆分、`App.tsx` 编排逻辑、练习流程阶段、Supabase schema/同步层、关键模块职责、构建脚本或包管理器），请同步更新本文件。新增非显而易见的约定时也应记录在此。

> **设计规范（强制）**：所有 UI 改动必须遵循 [`Design.md`](./Design.md) —— 颜色走 CSS 变量、复用 `@layer components` 中的语义类（`.glass-panel`、`.primary-button`、`.field` 等）、双主题同时维护。提交前对照 `Design.md` 末尾的清单自查；视觉系统本身要变更时，先改 `Design.md` 再改代码。

## Commands

本项目通过 Vite+ 的 `vp` CLI 驱动，日常开发请直接使用 `vp` 命令：

- `vp install` — 安装依赖（拉取远端变更后、开始工作前必跑）
- `vp dev` — 启动开发服务器
- `vp build` — 生产构建（构建前请确保 `tsc` 类型检查通过，可单独运行 `tsc --noEmit`）
- `vp preview` — 预览生产构建
- `vp check` — 一次性跑格式化、Lint、类型检查
- `vp test` — 运行 Vitest 测试
- `vp run <script>` — 执行 `package.json` 或 `vite.config.ts` 中定义的任务
- `vp help` / `vp <command> --help` — 查看命令说明

注意：`package.json` 中的 `pnpm dev` / `pnpm build` 只是对 `vp` 的薄封装，开发时优先用 `vp`；安装依赖也用 `vp install`，不要直接 `npm install`。

仓库中的 `CLAUDE.md` 是指向 `AGENTS.md` 的符号链接，更新本文件时请直接编辑 `AGENTS.md`。

## 架构

一个 React 19 + TypeScript + Vite 的单页应用，用于长文打字练习；后端使用 Supabase 做认证与同步，本地通过 `idb-keyval` 写入 IndexedDB 实现离线缓存。

### 状态层（`src/store/` 下的 Zustand stores）

四个独立的 store 共同组成运行时状态，刻意不合并为单一 store：

- **`authStore`** — Supabase session、user、密码恢复模式。`App.tsx` 启动时调用一次 `initialize()`，内部挂载 `onAuthStateChange` 监听器。
- **`articleStore`** — 文章列表、当前文章、管理弹窗、收藏。本地通过 `loadFromStorage` 持久化，登录后由 `syncFromCloud` / `syncFavorites` 拉取远端。
- **`typingStore`** — 单次打字会话：游标、按键流、WPM/准确率、完成标志。`loadArticle(content)` 重置会话；由 `useKeyboard` 与 `useTimer` 驱动。
- **`settingsStore`** — UI/主题/音效偏好与设置弹窗开关。

`App.tsx` 是编排者：先按 `authStore` 状态分流（`AuthGate` → `ResetPasswordGate` → 主界面）；同时有一个 `useEffect` 在 `typingStore.isFinished` 由 false 变 true 时通过 `lib/sync.ts` 上传会话数据。

### 练习流程

`reading` ↔ `typing` 两个阶段是 `App.tsx` 内部的局部 state，串联起来如下：

1. 用户在 `ArticleManager`（懒加载）选择文章 → 设置 `currentArticle`。
2. `App` 中的 effect 调用 `typingStore.loadArticle(content)` → 切到 `typing` 阶段。
3. `TypingStage` 渲染文本；`useKeyboard(authed && phase === "typing")` 把按键送入 `typingStore`。
4. 完成时 `FinishSummary` 替换练习区，上传 effect 触发。

全局快捷键直接写在 `App.tsx`：`Tab`（开/关文章管理器）、`Esc`（关闭弹窗）、`Ctrl+D`（用 `useDict` 查询当前选中文本）。

### 后端（Supabase）

- 客户端：`src/lib/supabase.ts`。数据库 schema 在 `docs/supabase-setup.sql` 与 `docs/public-articles-review.sql` —— 初始化新项目时需在 Supabase SQL 编辑器中执行这些脚本。
- 同步层：`src/lib/sync.ts`（上传打字会话）以及 `articleStore` 上的 `sync*` actions。
- 管理员功能（`ReviewQueueModal`）通过 `user.app_metadata.role === "admin"` 判定，见 `App.tsx` 中的 `isCurrentUserAdmin`。

### 其他关键模块

- `src/lib/textParser.ts` — 将文章内容解析为 `typingStore` 使用的字符模型。
- `src/lib/wpm.ts`、`src/lib/difficulty.ts` — 打字指标与文章难度评估。
- `src/i18n/` — i18next 配置，组件中统一使用 `react-i18next`。
- 样式：Tailwind v4（`@tailwindcss/vite`）；主题色通过 CSS 变量 (`var(--theme-bg)`、`var(--theme-accent-soft)` 等) 定义在 `src/style.css`，新增样式优先复用变量而不是硬编码颜色。

### 文章数据

内置文章位于 `src/data/articles/`，构建时打包进产物。用户上传的文章保存在 IndexedDB，登录后再同步到 Supabase。
