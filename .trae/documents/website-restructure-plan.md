# 网站架构全面优化方案

## Context（背景）

当前网站是基于 **Quarto** 的个人学习笔记站点，结构为「理论（数学机理 / 深度学习模型）+ 实战（项目 / 实验）+ 关于」，采用暖白底 (#fbfaf7) + 藏青主色 (#4056a1) 的简约设计。存在的问题：

- 内容分组层级（理论/实战）与用户实际认知的「四大核心板块」不匹配，缺少 **LLM学习** 板块；
- 导航多一层嵌套，访问不够直接；
- 各板块视觉无辨识度，配色单一；
- 实战下「项目/实验」为空目录，拆分意义不大。

用户要求按 **数学机理、深度学习模型、代码实战、LLM学习** 四大板块系统性重组，并要求：
1. 统一视觉风格 + 各板块辨识度；
2. 导航清晰分类、便捷访问；
3. 优化布局与信息层级；
4. 增强响应式；
5. 适当交互动效（风格偏朴素）。

**关键工作流约束**：用户希望直接把 `.ipynb` 文件放入对应板块文件夹，章节列表页即自动显示该文章——Quarto listing 的 `contents: ["*.ipynb"]` 已天然支持，保留并复制此机制到新板块即可。

用户已确认两项决策：
- **目录结构**：扁平化四大顶级目录（废弃 theory/practice 分组层）。
- **色彩体系**：统一主色 + 各板块标志辅助色。

---

## 一、优化后网站架构图

```
e:\My_site\
├── _quarto.yml              # 站点配置：导航重构为四大板块
├── index.qmd                # 首页：Hero + 四板块卡片 + 最近记录
├── about.qmd                # 关于页（补充最小内容）
├── styles.css               # 扩展样式：板块色系 / 卡片 / 响应式 / 微动效
├── assets/
│   └── images/
├── mathematics/             # 【数学机理】 ← 顶级板块
│   └── index.qmd            # listing *.ipynb + 靛蓝主题
├── deep-learning/           # 【深度学习模型】 ← 顶级板块
│   └── index.qmd            # listing *.ipynb + 青蓝主题
├── code/                    # 【代码实战】 ← 顶级板块（合并原 projects/experiments）
│   └── index.qmd            # listing *.ipynb + 琥珀主题
├── llm/                     # 【LLM学习】 ← 全新板块
│   └── index.qmd            # listing *.ipynb + 紫罗兰主题
└── docs/                    # 构建产物（不动，由 quarto render 重新生成）

【删除】theory/、practice/ 旧目录（其下仅 index.qmd 配置，无实际 notebook 内容，迁移后可安全移除）
```

**导航结构（_quarto.yml navbar.left）**：
```
数学机理 | 深度学习模型 | 代码实战 | LLM学习 | 关于        [GitHub]
```
四个板块平铺为一级菜单项，点击直达各板块 listing 页，无下拉嵌套。

---

## 二、色彩体系设计

**全局基础色（保持，确保整体一致）**：
| 变量 | 值 | 用途 |
|---|---|---|
| `--bg` | `#fbfaf7` | 暖白背景 |
| `--paper` | `#ffffff` | 卡片/纸面 |
| `--text` | `#263238` | 正文 |
| `--muted` | `#778087` | 次要文字 |
| `--line` | `#e6e2dc` | 分隔线 |
| `--accent` | `#4056a1` | 全局主色（藏青，同时是数学机理标志色）|

**各板块标志色（辨识度）**：通过每个板块 index.qmd 内嵌一段 `<style>`，在 `main.content` 作用域内覆盖 `--accent` 与 `--accent-soft`。因每板块是独立页面，作用域即页面级；导航栏保持全局主色不变，整体统一。

| 板块 | 标志色 `--accent` | 软底 `--accent-soft` | 寓意 |
|---|---|---|---|
| 数学机理 | `#4056a1` 靛蓝 | `#eef1fb` | 严谨、基础 |
| 深度学习模型 | `#00897b` 青蓝 | `#e0f2f1` | 神经、技术 |
| 代码实战 | `#e65100` 深琥珀 | `#fff3e0` | 实践、行动 |
| LLM学习 | `#6a1b9a` 紫罗兰 | `#f3e5f5` | 前沿、智能 |

首页四张卡片**同时**呈现四种标志色（通过显式 class `.theme-math / .theme-dl / .theme-code / .theme-llm` 设置局部 `--accent`），让用户一进首页即建立「色—板块」映射。

---

## 三、页面设计方案

### 3.1 首页 `index.qmd`
- **Hero**：保留 `学习 · 理解 · 实践` kicker + 大字号姓名 + 一句描述（clamp 流式字号，已有）。
- **四板块卡片**（核心改动）：2×2 网格（桌面）/ 单列（移动）。每张卡片结构：
  - 顶部小标签（如 `MATH` / `DL` / `CODE` / `LLM`），用该板块标志色；
  - 板块标题（h3）；
  - 一句描述；
  - `进入 →` 链接，hover 时箭头右移、下划线显现。
  - 卡片 hover：轻微上浮 + 边框加深 + 阴影（已有，保留并按标志色微调边框）。
- **最近记录**：改为**真实 listing**，聚合四大板块最新 notebook（`contents` 指向四个目录的 `*.ipynb`，按日期倒序，限 5 条）。直接支撑「丢 ipynb → 首页可见」工作流。

### 3.2 板块 listing 页 `mathematics/index.qmd` 等
统一结构（仅标志色与文案不同）：
```qmd
---
title: "数学机理"
listing:
  contents: ["*.ipynb"]
  sort: "date desc"
  type: default
  fields: [title, description, date, categories]
  categories: true
  sort-ui: false
  filter-ui: false
---
<style>
main.content { --accent: #4056a1; --accent-soft: #eef1fb; }
</style>
```
页面标题、列表 hover、分类标签、表格表头等凡用 `var(--accent)` 处，自动套用本板块标志色。用户后续把任意 `.ipynb` 放进该文件夹即自动出现在列表与首页「最近记录」。

### 3.3 关于页 `about.qmd`
当前为空，补充最小可读内容（简短自我介绍 + 站点说明占位），用户可自行编辑。

---

## 四、实施步骤

1. **新建四大板块目录与 listing 页**
   - 创建 `mathematics/index.qmd`、`deep-learning/index.qmd`、`code/index.qmd`、`llm/index.qmd`
   - 每页内含 listing 配置 + 内嵌 `<style>` 设置该板块标志色
   - 文案差异化（数学：线代/概率/优化；DL：CNN/Transformer/Diffusion；代码：项目/实现；LLM：Prompt/微调/RAG/Agent）

2. **重写 `_quarto.yml`**
   - `navbar.left` 改为四个扁平一级菜单 + 关于
   - 保留 `navbar.right` GitHub、`page-footer`、`theme: cosmo`、`css: styles.css`、KaTeX、smooth-scroll 等既有配置

3. **重写 `index.qmd` 首页**
   - Hero（微调文案）
   - 四张带 `theme-*` class 的卡片
   - 「最近记录」改为聚合 listing

4. **扩展 `styles.css`**
   - 新增 `.theme-math/.theme-dl/.theme-code/.theme-llm` class（设置局部 `--accent`/`--accent-soft`）
   - 卡片样式：标志色标签、hover 箭头位移、边框着色
   - listing 页：标题色、hover 软底、分类标签色
   - 响应式增强：`760px` 断点下卡片单列、字号 clamp、navbar 折叠（Bootstrap 自带）
   - 微动效（朴素、尊重 `prefers-reduced-motion`）：首页区块淡入、卡片 hover 过渡

5. **补充 `about.qmd` 最小内容**

6. **删除旧目录** `theory/`、`practice/`（迁移完配置后）

---

## 五、涉及文件清单

| 文件 | 操作 |
|---|---|
| `_quarto.yml` | 修改：navbar 重构 |
| `index.qmd` | 重写：四卡片 + 最近 listing |
| `styles.css` | 扩展：板块色系/卡片/响应式/动效 |
| `mathematics/index.qmd` | 新建 |
| `deep-learning/index.qmd` | 新建 |
| `code/index.qmd` | 新建 |
| `llm/index.qmd` | 新建 |
| `about.qmd` | 补充内容 |
| `theory/`、`practice/` | 删除 |

---

## 六、验证方法

1. **构建**：在 `e:\My_site` 执行 `quarto render`（或 `quarto preview` 本地预览）。
2. **首页**：确认四张卡片各自呈现对应标志色；hover 有上浮与箭头位移；「最近记录」区正常（暂无 notebook 时显示空态即可）。
3. **导航**：点击四个一级菜单直达对应板块页，URL 为 `/mathematics/` 等。
4. **板块页**：标题、listing hover、分类标签使用该板块标志色（与首页卡片色一致）。
5. **工作流验证**：把一个测试 `.ipynb` 放入 `mathematics/`，重新 `quarto render`，确认它出现在板块列表页与首页「最近记录」。
6. **响应式**：浏览器 DevTools 切到移动宽度（≤760px），卡片变单列、字号自适应、导航折叠正常。
7. **动效**：确认动效轻微不喧宾夺主；系统开启「减少动态效果」时动效关闭。

---

## 七、实施建议（交付后使用指南）

- **新增文章**：直接把 `.ipynb`（含 `title`/`description`/`date`/`categories` 元信息）丢进对应板块文件夹，`quarto render` 后即出现在该板块列表与首页最近记录，无需改任何配置。
- **新增板块**：复制任一板块目录结构，在 `_quarto.yml` 加一条菜单、在 `styles.css` 加一个 `.theme-xxx` class、首页加一张卡片即可。
- **配色微调**：每板块标志色集中在其 `index.qmd` 内嵌 `<style>` 与首页卡片 class，改一处即生效。
- **风格延续**：当前为朴素简约风，后续若需丰富，可在 `styles.css` 末尾追加，勿破坏既有变量体系。
