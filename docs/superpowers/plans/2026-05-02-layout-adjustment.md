# 页面布局调整实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在不影响现有 44 项正式内置素材显示与播放的前提下，完成首页、自由探索、引导训练三页的大屏触摸布局调整。

**架构：** 改动限定在儿童侧页面结构类名与 `global.css` 布局规则，不修改素材数据、播放逻辑、出题逻辑和统计逻辑。测试优先验证新的页面结构和引导训练候选区的布局状态，再通过现有行为测试和构建验证没有回归。

**技术栈：** React 19、TypeScript、Vite、Vitest、React Testing Library、CSS

---

### 任务 1：为布局结构补充失败测试

**文件：**
- 修改：`src/screens/home-screen.test.tsx`
- 修改：`src/modules/explore/explore-screen.test.tsx`
- 修改：`src/modules/guided/guided-screen.test.tsx`
- 测试：`src/screens/home-screen.test.tsx`
- 测试：`src/modules/explore/explore-screen.test.tsx`
- 测试：`src/modules/guided/guided-screen.test.tsx`

- [ ] **步骤 1：在首页测试中先表达新的大屏布局骨架**

`src/screens/home-screen.test.tsx`

```tsx
it('renders a wide hero layout with a dedicated action grid', () => {
  render(<HomeScreen />)

  expect(screen.getByTestId('home-hero')).toBeInTheDocument()
  expect(screen.getByTestId('home-action-grid')).toBeInTheDocument()
})
```

- [ ] **步骤 2：在自由探索测试中先表达独立状态带和大屏卡片区**

`src/modules/explore/explore-screen.test.tsx`

```tsx
expect(screen.getByTestId('explore-status-panel')).toBeInTheDocument()
expect(screen.getByTestId('explore-grid')).toHaveAttribute('data-layout', 'touch-grid')
```

- [ ] **步骤 3：在引导训练测试中先表达候选区会暴露候选数量布局状态**

`src/modules/guided/guided-screen.test.tsx`

```tsx
expect(screen.getByTestId('guided-grid')).toHaveAttribute('data-option-count', '2')
```

- [ ] **步骤 4：运行三组测试，确认它们因缺少新结构而失败**

运行：

```bash
source ./scripts/use-node-env.sh
npm exec vitest run -- src/screens/home-screen.test.tsx src/modules/explore/explore-screen.test.tsx src/modules/guided/guided-screen.test.tsx
```

预期：FAIL，报错缺少新的 `data-testid` 或 `data-option-count`。

### 任务 2：调整三页结构，暴露大屏布局骨架

**文件：**
- 修改：`src/screens/home-screen.tsx`
- 修改：`src/modules/explore/explore-screen.tsx`
- 修改：`src/modules/guided/guided-screen.tsx`
- 修改：`src/modules/explore/explore-card.tsx`
- 测试：`src/screens/home-screen.test.tsx`
- 测试：`src/modules/explore/explore-screen.test.tsx`
- 测试：`src/modules/guided/guided-screen.test.tsx`

- [ ] **步骤 1：为首页补充 hero 和 action grid 结构**

`src/screens/home-screen.tsx`

```tsx
<div className="hero-copy" data-testid="home-hero">...</div>
<div className="home-actions" data-testid="home-action-grid" role="group" aria-label="训练模式">...</div>
```

- [ ] **步骤 2：为自由探索补充可测试的状态面板和网格标记**

`src/modules/explore/explore-screen.tsx`

```tsx
<div className="explore-status-panel" data-testid="explore-status-panel">
  <p className={...} role="status">...</p>
</div>

<div
  aria-label={`${CATEGORY_LABELS[activeCategory]}素材列表`}
  className="explore-grid"
  data-layout="touch-grid"
  data-testid="explore-grid"
>
```

- [ ] **步骤 3：为引导训练候选区暴露候选数量状态**

`src/modules/guided/guided-screen.tsx`

```tsx
<div
  aria-label="引导训练候选项"
  className="guided-grid"
  data-option-count={String(question.candidates.length)}
  data-testid="guided-grid"
>
```

- [ ] **步骤 4：运行三组测试，确认结构层全部转绿**

运行：

```bash
source ./scripts/use-node-env.sh
npm exec vitest run -- src/screens/home-screen.test.tsx src/modules/explore/explore-screen.test.tsx src/modules/guided/guided-screen.test.tsx
```

预期：PASS。

### 任务 3：实现大屏触摸布局样式并完成验证

**文件：**
- 修改：`src/styles/global.css`
- 读取：`docs/superpowers/specs/2026-05-02-layout-adjustment-design.md`
- 测试：`src/screens/home-screen.test.tsx`
- 测试：`src/modules/explore/explore-screen.test.tsx`
- 测试：`src/modules/guided/guided-screen.test.tsx`

- [ ] **步骤 1：在 `global.css` 中放宽主容器并按三页规格调整层级**

`src/styles/global.css`

```css
.screen-panel {
  width: min(1480px, 100%);
}

.screen-panel--home,
.screen-panel--explore,
.screen-panel--guided {
  gap: clamp(1.5rem, 2vw, 2.5rem);
}

.explore-grid,
.guided-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
```

同时补齐：

- 首页主入口卡更高、更宽
- 自由探索状态带与分类按钮尺寸放大
- 引导训练控制带、反馈带和候选区尺寸放大
- 根据 `data-option-count='2' | '3' | '4'` 调整引导训练列数
- 中屏和窄屏回退到 `3 / 2 / 1` 列

- [ ] **步骤 2：运行相关测试，确认布局标记没有破坏既有行为**

运行：

```bash
source ./scripts/use-node-env.sh
npm exec vitest run -- src/screens/home-screen.test.tsx src/modules/explore/explore-screen.test.tsx src/modules/guided/guided-screen.test.tsx
```

预期：PASS。

- [ ] **步骤 3：运行全量测试和构建，确认没有功能回归**

运行：

```bash
source ./scripts/use-node-env.sh
npm test
npm run build
```

预期：全部测试通过，前端构建成功。

- [ ] **步骤 4：启动页面并收集布局验证证据**

运行：

```bash
source ./scripts/use-node-env.sh
npm run dev
```

预期：本地 `1420` 端口可访问。收集首页、自由探索、引导训练的最新截图，并确认 44 项正式素材的图片与音频交互未受布局改动影响。

---

## 自检

- 规格覆盖度：已覆盖首页、自由探索、引导训练的结构、尺寸方向和候选数量适配要求。
- 占位符扫描：未使用 `TODO / 待定 / 后续实现` 等占位描述。
- 类型一致性：测试和实现统一使用 `data-testid='home-hero'`、`data-testid='home-action-grid'`、`data-testid='explore-status-panel'`、`data-testid='explore-grid'`、`data-testid='guided-grid'` 和 `data-option-count`。

---

计划已完成并保存到 `docs/superpowers/plans/2026-05-02-layout-adjustment.md`。按用户“继续做完”的要求，本轮直接采用当前会话内联执行。
