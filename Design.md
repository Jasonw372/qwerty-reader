# Design.md

本项目的视觉与交互规范。**所有新增/修改 UI 必须遵循以下约定**；偏离需要在 PR 描述中给出理由。变更视觉系统本身时，先更新本文件再改代码。

## 设计基调

- 终端 / 编辑器质感：等宽字体为主、低饱和、夜色与羊皮纸两套主题。
- 内容优先：所有 chrome（HUD、按钮、弹窗）都让位于打字区域，避免抢视觉重心。
- 静态克制 + 局部动效：装饰只用渐变、网格、晕影；动效仅用于反馈（按键、完成、错误抖动）。

## 技术栈约定

- **Tailwind CSS v4 优先**（`@tailwindcss/vite`）：所有样式默认用 utility 类完成 —— 布局 (`flex`、`grid`、`gap-*`)、间距 (`px-*`、`py-*`、`mt-*`)、尺寸 (`w-*`、`h-*`)、圆角 (`rounded-*`)、字号 (`text-*`)、字重 (`font-*`)，以及通过 `@theme` 映射的 token utility (`bg-bg`、`bg-surface`、`text-text-correct`、`border-border`、`font-mono` 等) 都直接写在 JSX 里。
- **`src/style.css` 是兜底**：只有 Tailwind 表达不了或会非常笨重的场景才走自定义 CSS，主要包括：
  - 多层叠加背景 / 滤镜 / `backdrop-filter`（如 `.app-shell`、`.glass-panel`）
  - 复杂状态组合或第三方库覆盖（如 `.field:focus` 光晕、`.article-content-editor .cm-*`）
  - 动画关键帧（`blink`、`shake`、`pop-in`、`float-in` 等）
  - 复用频次高、用 utility 写超过 ~8 个类的组件态（按钮、面板）
- 写之前先问：**能否用 Tailwind utility 直接表达？** 能就直接写；不能再回到 `@layer components` 里加语义类。不要默认抽类。
- **禁用**的是 Tailwind 内置调色板（`bg-slate-800`、`text-red-500`、`border-zinc-400` 等）和硬编码颜色 —— 它们绕过主题切换。颜色一律走 `@theme` token 或 `var(--theme-...)`。

## 主题与令牌

唯一颜色来源是 `src/style.css` 中的 CSS 变量，两套主题 (`[data-theme="dark"]` Tokyo Night、`[data-theme="parchment"]` Solarized) 必须同时维护。

| 类别 | 变量                                                                                          | 用途                          |
| ---- | --------------------------------------------------------------------------------------------- | ----------------------------- |
| 背景 | `--theme-bg` / `--theme-surface` / `--theme-surface-elevated`                                 | 页面、面板、浮层（带透明）    |
| 边线 | `--theme-border` / `--theme-border-strong`                                                    | 默认 / 强调描边               |
| 文本 | `--theme-text-pending` / `--theme-text-correct` / `--theme-text-error` / `--theme-text-muted` | 未输入 / 正确 / 错误 / 弱提示 |
| 焦点 | `--theme-cursor`                                                                              | 光标、focus 环、选择高亮      |
| 强调 | `--theme-accent` / `--theme-accent-soft`                                                      | 高亮、徽标、active line       |
| 氛围 | `--theme-hud-bg` / `--theme-shadow` / `--theme-vignette` / `--theme-grain`                    | HUD、阴影、晕影、栅格         |

规则：

- 用 Tailwind utility 排版/布局没问题，但**颜色相关**的 utility 只能用 `@theme` 中映射的 token（如 `bg-bg`、`bg-surface`、`text-text-correct`、`text-text-pending`、`border-border`、`text-cursor`），或直接写 `style={{ color: "var(--theme-...)" }}` / `bg-[var(--theme-...)]`。
- **禁止**使用 Tailwind 内置调色板 (`bg-slate-*`、`text-red-*`、`border-zinc-*` …) 和十六进制 / `rgb()` 硬编码。
- 半透明用 `color-mix(in srgb, var(--theme-...) X%, transparent)`，不要写死 `rgba()`。
- 错误背景统一用 `--theme-text-error-bg`，不要自己调透明度。
- 新增颜色语义时先在 `style.css` 的两套主题中各加一项变量，并在 `@theme` 里映射成 Tailwind token，然后再使用。

## 字体与排版

- 字体：JetBrains Mono（`--font-mono`），权重 400 / 500。正文与 UI 一律等宽，仅在需要符号兼容时用 `.space-symbol` fallback。
- 抗锯齿：`-webkit-font-smoothing: antialiased`（已在 body 设置，不要覆盖）。
- 大小：练习区 ≈ `text-2xl` 上下；HUD/控件 `text-sm` 或 `text-xs`；CodeMirror 编辑器固定 `0.9375rem` / `line-height: 1.68`。
- 行高偏舒展（1.5–1.7），优先保留呼吸感而不是塞更多内容。

## 组件类（既有的就复用，不要重造）

`@layer components` 中已存在的语义类是因为 Tailwind 写起来太笨重才沉淀的，**遇到同类需求直接复用**，不要在 JSX 里用一长串 utility 重新堆一个：

- `.glass-panel` — 浮层 / 弹窗主体，`backdrop-filter: blur(18px) saturate(140%)`。
- `.hairline-panel` — 嵌入式面板（如 HUD 内卡片），实色微渐变 + 细边。
- `.icon-button` / `.soft-button` — 次级动作按钮，hover 抬升 1px、边变 strong、色升到 `text-correct`。
- `.primary-button` — 主行动按钮，绿色填充、阴影染色；一个屏幕里最多一个。
- `.field` — 表单输入框，focus 时用 `cursor` 色 + 18% 光晕。
- `.article-content-editor` — CodeMirror 包裹层，已定义 cursor / 选区 / 占位符 / invalid 字符样式。

**什么时候新增语义类**：日常 UI 优先 Tailwind utility；只有当 utility 表达不了（多层背景、`backdrop-filter`、第三方库选择器）或同一组合在 ≥ 3 个地方出现且每处 ≥ 8 个 utility 时，才抽到 `style.css` 的 `@layer components`。

## 形状 / 间距 / 阴影

- 圆角：弹窗 `rounded-2xl`，卡片/按钮 `rounded-xl`，输入与小徽标 `rounded-lg` / `rounded-full`。不要用尖角。
- 边线：`1px solid var(--theme-border)`，强调态切到 `--theme-border-strong`，不要加粗到 2px。
- 阴影：只用 `var(--theme-shadow)` 衍生的层级；不要自己写 `shadow-2xl` 之类的 Tailwind 默认阴影。
- 间距：组件内部 padding 走 `px-6 py-5` / `px-4 py-3` 这种偶数节奏；模块之间用 `gap-*` 而不是手写 margin。

## 背景层级（`app-shell`）

主壳 `.app-shell` 由三层叠加构成（径向渐变 × 2 + 线性渐变），并通过 `::before` 注入栅格、`::after` 注入底部羽化。新增全屏页面（如登陆/重置密码）**必须**复用 `.app-shell`，不要重写背景。

## 交互与动效

- 时长：常规 hover/focus 过渡 `0.18s ease`；进入动画 `0.15s–0.42s`。
- 已定义的关键帧：`blink`（光标）、`shake`（错误反馈）、`pop-in`（数值/徽标出现）、`pulse-glow`（loading）、`float-in`（面板进入）。新动效优先复用，不行再加。
- hover 抬升只用 `translateY(-1px)`，不要更大位移。
- 不要给整个页面加 `transition: all`；只过渡 `color` / `background-color` / `border-color` / `box-shadow` / `transform` / `filter`。

## 可访问性

- 焦点态必须可见：表单走 `.field:focus`，按钮 hover/focus 都要变 `border-strong` + 颜色提亮。不要 `outline: none` 后不补 focus 样式。
- 颜色对比在两套主题下都要验证；错误色与背景对比已校准，不要用 muted 色承载错误信息。
- 全局快捷键写在 `App.tsx`，新增前先查 `Tab` / `Esc` / `Ctrl+D` 是否冲突。

## 写代码时的检查清单

提交 UI 改动前自查：

- [ ] **Tailwind 优先**：能用 utility 写的没回退到自定义 CSS；确实需要的多层效果才走 `@layer components`。
- [ ] 颜色 100% 走 `@theme` token 或 `var(--theme-...)`，没有硬编码色值或 Tailwind 内置调色板（`slate-*`/`red-*`/…）。
- [ ] 两套主题都看过一遍（切换 `data-theme` 属性）。
- [ ] 既有语义类 (`.glass-panel`/`.primary-button`/`.field` 等) 该复用的都复用了，没有重新堆一份。
- [ ] 圆角、边线、阴影沿用现有节奏，没有引入新值。
- [ ] 字体是 JetBrains Mono；行高没被压扁。
- [ ] 交互过渡控制在 `0.18s` 量级，hover 抬升不超过 1px。
- [ ] 焦点态可见，没有裸 `outline: none`。
