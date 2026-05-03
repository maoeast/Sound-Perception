# 首页标题与软件名称自定义实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 支持教师台自定义软件应用标题，并将其同步到首页主标题、浏览器页标题和 Tauri 窗口标题，同时去掉首页旧提示文案。

**架构：** 扩展 `TrainingSettings` 和 `settings` 表以持久化 `appTitle`，在数据库初始化链路补运行时迁移；`AppRouter` 统一加载并同步标题状态，将其传给 `HomeScreen`，并在标题变化时更新 `document.title` 与 Tauri 窗口标题。

**技术栈：** React 19、TypeScript、Vitest、sql.js、Tauri 2

---

### 任务 1：补标题设置与首页展示的失败测试

**文件：**
- 修改：`src/modules/admin/settings-store.test.ts`
- 修改：`src/modules/admin/settings-screen.test.tsx`
- 修改：`src/screens/home-screen.test.tsx`
- 修改：`src/app/router.test.tsx`

- [ ] 步骤 1：新增失败测试，覆盖默认标题、教师台保存标题、首页显示新标题、`document.title` 同步
- [ ] 步骤 2：运行 `npm test -- src/modules/admin/settings-store.test.ts src/modules/admin/settings-screen.test.tsx src/screens/home-screen.test.tsx src/app/router.test.tsx` 验证红灯

### 任务 2：实现设置模型与数据库迁移

**文件：**
- 修改：`src/db/schema.ts`
- 修改：`src/db/db-client.ts`
- 修改：`src/modules/assets/asset-repository.ts`
- 修改：`src/modules/admin/settings-store.ts`

- [ ] 步骤 1：给 `settings` 表增加 `app_title`
- [ ] 步骤 2：在数据库初始化时补 `app_title` 迁移
- [ ] 步骤 3：扩展 `TrainingSettings`、读取与保存逻辑

### 任务 3：实现教师台、首页与应用壳标题同步

**文件：**
- 修改：`src/modules/admin/settings-screen.tsx`
- 修改：`src/screens/home-screen.tsx`
- 修改：`src/app/router.tsx`
- 修改：`src/screens/admin-shell.tsx`

- [ ] 步骤 1：教师台新增 `软件应用标题` 输入框
- [ ] 步骤 2：首页改为只显示居中大标题
- [ ] 步骤 3：`AppRouter` 统一刷新设置，并同步 `document.title` / Tauri 窗口标题

### 任务 4：样式与验证

**文件：**
- 修改：`src/styles/global.css`

- [ ] 步骤 1：放大并居中首页主标题，移除旧提示层级
- [ ] 步骤 2：运行相关测试验证绿灯
- [ ] 步骤 3：运行 `npm test`
- [ ] 步骤 4：运行 `npm run build`
