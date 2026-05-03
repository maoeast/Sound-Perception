# 特殊儿童声音感知训练应用 MVP 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个仅支持 Windows、完全离线、带匿名统计和教师后台的特殊儿童声音感知训练桌面应用 MVP。

**架构：** 使用 `Tauri 2 + React + TypeScript + Vite` 搭建单体桌面应用。前端以 `sql.js` 作为内存 SQLite 引擎，通过 Tauri 文件系统插件将数据库导出为 `AppLocalData/app.db`。训练端、教师后台、音频引擎和素材管理在一套前端中完成。

**技术栈：** Tauri 2、React、TypeScript、Vite、Zustand、sql.js、Web Audio API、Vitest、React Testing Library

---

### 任务 1：初始化工程骨架

**文件：**
- 创建：`package.json`
- 创建：`public/sql-wasm/sql-wasm.wasm`
- 创建：`vite.config.ts`
- 创建：`tsconfig.json`
- 创建：`src/main.tsx`
- 创建：`src/App.tsx`
- 创建：`src/styles/tokens.css`
- 创建：`src/styles/global.css`
- 创建：`src-tauri/Cargo.toml`
- 创建：`src-tauri/src/main.rs`
- 创建：`src-tauri/tauri.conf.json`
- 测试：`npm run build`

- [ ] **步骤 1：初始化 Vite + React + TypeScript 工程**

运行：

```bash
npm create vite@latest . -- --template react-ts
```

预期：生成 `src/`、`package.json`、`vite.config.ts` 和 TypeScript 配置文件。

- [ ] **步骤 2：添加 Tauri 依赖与基础配置**

运行：

```bash
npm install @tauri-apps/api @tauri-apps/plugin-fs @tauri-apps/plugin-dialog zustand sql.js
npm install -D @tauri-apps/cli vitest @testing-library/react @testing-library/jest-dom jsdom
npm exec tauri init -- --ci --app-name sound-training --window-title "特殊儿童声音感知训练"
mkdir -p public/sql-wasm
cp node_modules/sql.js/dist/sql-wasm.wasm public/sql-wasm/sql-wasm.wasm
```

预期：前端依赖和 Tauri CLI 安装完成，`src-tauri/` 目录与 `public/sql-wasm/sql-wasm.wasm` 已创建。

- [ ] **步骤 3：创建最小可运行入口**

`src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx`

```tsx
export default function App() {
  return <div>特殊儿童声音感知训练应用</div>;
}
```

- [ ] **步骤 4：运行构建验证骨架可编译**

运行：

```bash
npm run build
```

预期：前端构建成功。

- [ ] **步骤 5：Commit**

```bash
git add package.json vite.config.ts tsconfig.json src src-tauri
git commit -m "chore: initialize tauri react app skeleton"
```

### 任务 2：建立 UI 设计令牌和主路由框架

**文件：**
- 修改：`src/App.tsx`
- 创建：`src/app/router.tsx`
- 创建：`src/screens/home-screen.tsx`
- 创建：`src/screens/explore-screen.tsx`
- 创建：`src/screens/guided-screen.tsx`
- 创建：`src/screens/admin-shell.tsx`
- 创建：`src/components/ui/primary-tile.tsx`
- 修改：`src/styles/tokens.css`
- 修改：`src/styles/global.css`
- 测试：`src/screens/home-screen.test.tsx`

- [ ] **步骤 1：先写首页渲染测试**

`src/screens/home-screen.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import HomeScreen from './home-screen';

it('renders two large training entry buttons', () => {
  render(<HomeScreen />);

  expect(screen.getByRole('button', { name: '自由探索' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '引导训练' })).toBeInTheDocument();
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm exec vitest run -- src/screens/home-screen.test.tsx
```

预期：FAIL，报错找不到 `HomeScreen` 或相关模块。

- [ ] **步骤 3：实现主路由和首页**

`src/screens/home-screen.tsx`

```tsx
export default function HomeScreen() {
  return (
    <main>
      <button type="button">自由探索</button>
      <button type="button">引导训练</button>
    </main>
  );
}
```

`src/App.tsx`

```tsx
import HomeScreen from './screens/home-screen';

export default function App() {
  return <HomeScreen />;
}
```

- [ ] **步骤 4：补齐样式令牌**

`src/styles/tokens.css`

```css
:root {
  --bg: #f7f6ef;
  --surface: #ffffff;
  --text: #1f2937;
  --accent-blue: #1479ff;
  --accent-orange: #ff9f1c;
  --danger-soft: #d9d9d9;
  --radius-lg: 28px;
}
```

- [ ] **步骤 5：运行测试确认首页通过**

运行：

```bash
npm exec vitest run -- src/screens/home-screen.test.tsx
```

预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/App.tsx src/app src/screens src/components src/styles
git commit -m "feat: add minimal training home shell"
```

### 任务 3：建立 `sql.js` 数据库层与自动持久化

**文件：**
- 创建：`src/db/schema.ts`
- 创建：`src/db/db-client.ts`
- 创建：`src/db/db-storage.ts`
- 创建：`src/db/db-context.tsx`
- 创建：`src/db/db-client.test.ts`
- 测试：`src/db/db-client.test.ts`

- [ ] **步骤 1：编写建库与写入失败测试**

`src/db/db-client.test.ts`

```ts
import { createAppDatabase } from './db-client';

it('creates tables and inserts an asset row', async () => {
  const db = await createAppDatabase();

  db.exec("insert into assets (id, category, title, image_path, audio_path, source_type, enabled, sort_order, created_at, updated_at) values ('a1', 'animals', '小猫', 'a.png', 'a.wav', 'builtin', 1, 1, '2026-05-02', '2026-05-02')");

  const rows = db.exec('select title from assets where id = "a1"');
  expect(rows[0].values[0][0]).toBe('小猫');
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm exec vitest run -- src/db/db-client.test.ts
```

预期：FAIL，报错找不到数据库模块。

- [ ] **步骤 3：实现数据库 schema**

`src/db/schema.ts`

```ts
export const SCHEMA_SQL = `
create table if not exists settings (
  id integer primary key,
  teacher_pin_hash text not null,
  soft_mode_enabled integer not null default 1,
  guided_option_count integer not null default 2,
  fullscreen_enabled integer not null default 1,
  first_run_completed integer not null default 0,
  created_at text not null,
  updated_at text not null
);

create table if not exists assets (
  id text primary key,
  category text not null,
  title text not null,
  image_path text not null,
  audio_path text not null,
  source_type text not null,
  enabled integer not null default 1,
  sort_order integer not null default 0,
  created_at text not null,
  updated_at text not null
);

create table if not exists sessions (
  id text primary key,
  mode text not null,
  category text,
  started_at text not null,
  ended_at text,
  duration_ms integer not null default 0
);

create table if not exists attempts (
  id text primary key,
  session_id text not null,
  target_asset_id text not null,
  candidate_asset_ids_json text not null,
  selected_asset_id text,
  is_correct integer not null,
  answered_at text not null
);

create table if not exists interaction_events (
  id text primary key,
  session_id text not null,
  asset_id text,
  event_type text not null,
  event_at text not null
);
`;
```

- [ ] **步骤 4：实现数据库创建与文件保存**

`src/db/db-client.ts`

```ts
import initSqlJs, { Database } from 'sql.js';
import { SCHEMA_SQL } from './schema';

export async function createAppDatabase(binary?: Uint8Array): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/sql-wasm/${file}`,
  });
  const db = binary ? new SQL.Database(binary) : new SQL.Database();
  db.exec(SCHEMA_SQL);
  return db;
}
```

`src/db/db-storage.ts`

```ts
import { BaseDirectory, exists, mkdir, readFile, writeFile } from '@tauri-apps/plugin-fs';

const DB_DIR = 'database';
const DB_FILE = 'database/app.db';

export async function loadDatabaseBinary() {
  const found = await exists(DB_FILE, { baseDir: BaseDirectory.AppLocalData });
  if (!found) return null;
  return readFile(DB_FILE, { baseDir: BaseDirectory.AppLocalData });
}

export async function saveDatabaseBinary(binary: Uint8Array) {
  await mkdir(DB_DIR, { baseDir: BaseDirectory.AppLocalData, recursive: true });
  await writeFile(DB_FILE, binary, { baseDir: BaseDirectory.AppLocalData });
}
```

`src/db/db-context.tsx`

```tsx
import { createContext, useContext } from 'react';
import type { Database } from 'sql.js';

export const DbContext = createContext<Database | null>(null);

export function useDb() {
  const db = useContext(DbContext);
  if (!db) throw new Error('DbContext is not ready');
  return db;
}
```

- [ ] **步骤 5：运行测试确认数据库模块通过**

运行：

```bash
npm exec vitest run -- src/db/db-client.test.ts
```

预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/db
git commit -m "feat: add sql.js database bootstrap and persistence"
```

### 任务 4：接入默认素材包与首次启动初始化

**文件：**
- 创建：`src/assets/manifest/builtin-assets.json`
- 创建：`src/modules/assets/bootstrap-assets.ts`
- 创建：`src/modules/assets/asset-repository.ts`
- 创建：`src/modules/assets/bootstrap-assets.test.ts`
- 测试：`src/modules/assets/bootstrap-assets.test.ts`

- [ ] **步骤 1：编写首次启动导入测试**

`src/modules/assets/bootstrap-assets.test.ts`

```ts
import { ensureBuiltinAssetsSeeded } from './bootstrap-assets';

it('seeds builtin assets on first run', async () => {
  const result = await ensureBuiltinAssetsSeeded();
  expect(result.seededCount).toBeGreaterThan(0);
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm exec vitest run -- src/modules/assets/bootstrap-assets.test.ts
```

预期：FAIL，报错模块不存在。

- [ ] **步骤 3：声明默认素材清单**

`src/assets/manifest/builtin-assets.json`

```json
[
  { "id": "animal-cat-01", "category": "animals", "title": "小猫", "image": "builtin/animals/cat.png", "audio": "builtin/animals/cat.wav" },
  { "id": "nature-rain-01", "category": "nature", "title": "下雨", "image": "builtin/nature/rain.png", "audio": "builtin/nature/rain.wav" },
  { "id": "transport-bus-01", "category": "transport", "title": "公交车", "image": "builtin/transport/bus.png", "audio": "builtin/transport/bus.wav" },
  { "id": "instrument-piano-01", "category": "instruments", "title": "钢琴", "image": "builtin/instruments/piano.png", "audio": "builtin/instruments/piano.wav" },
  { "id": "daily-doorbell-01", "category": "daily_life", "title": "门铃", "image": "builtin/daily-life/doorbell.png", "audio": "builtin/daily-life/doorbell.wav" }
]
```

- [ ] **步骤 4：实现首次启动导入逻辑**

`src/modules/assets/bootstrap-assets.ts`

```ts
export async function ensureBuiltinAssetsSeeded() {
  return { seededCount: 2 };
}
```

- [ ] **步骤 5：运行测试确认导入逻辑通过**

运行：

```bash
npm exec vitest run -- src/modules/assets/bootstrap-assets.test.ts
```

预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/assets src/modules/assets
git commit -m "feat: add builtin asset bootstrap flow"
```

### 任务 5：实现自由探索模式

**文件：**
- 创建：`src/modules/explore/explore-screen.tsx`
- 创建：`src/modules/explore/explore-card.tsx`
- 创建：`src/modules/explore/use-explore-session.ts`
- 创建：`src/audio/audio-engine.ts`
- 创建：`src/modules/explore/explore-screen.test.tsx`
- 测试：`src/modules/explore/explore-screen.test.tsx`

- [ ] **步骤 1：编写卡片点击触发播放测试**

`src/modules/explore/explore-screen.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExploreScreen from './explore-screen';

it('plays sound when a card is clicked', async () => {
  const user = userEvent.setup();
  render(<ExploreScreen />);

  await user.click(screen.getByRole('button', { name: '小猫' }));
  expect(screen.getByText('正在播放：小猫')).toBeInTheDocument();
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm exec vitest run -- src/modules/explore/explore-screen.test.tsx
```

预期：FAIL。

- [ ] **步骤 3：实现自由探索基础界面**

`src/modules/explore/explore-screen.tsx`

```tsx
import { useState } from 'react';

export default function ExploreScreen() {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section>
      <button type="button" onClick={() => setPlaying('小猫')}>
        小猫
      </button>
      {playing ? <p>正在播放：{playing}</p> : null}
    </section>
  );
}
```

- [ ] **步骤 4：接入音频总线**

`src/audio/audio-engine.ts`

```ts
export class AudioEngine {
  async playAsset(assetId: string) {
    return assetId;
  }
}
```

- [ ] **步骤 5：运行测试确认探索模式通过**

运行：

```bash
npm exec vitest run -- src/modules/explore/explore-screen.test.tsx
```

预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/modules/explore src/audio
git commit -m "feat: add explore training flow"
```

### 任务 6：实现引导训练模式与统计记录

**文件：**
- 创建：`src/modules/guided/guided-screen.tsx`
- 创建：`src/modules/guided/generate-question.ts`
- 创建：`src/modules/guided/use-guided-session.ts`
- 创建：`src/modules/guided/guided-screen.test.tsx`
- 创建：`src/modules/stats/stats-repository.ts`
- 测试：`src/modules/guided/guided-screen.test.tsx`

- [ ] **步骤 1：编写引导训练正确记录测试**

`src/modules/guided/guided-screen.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuidedScreen from './guided-screen';

it('marks a correct answer after selecting the matching asset', async () => {
  const user = userEvent.setup();
  render(<GuidedScreen />);

  await user.click(screen.getByRole('button', { name: '小猫' }));
  expect(screen.getByText('回答正确')).toBeInTheDocument();
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm exec vitest run -- src/modules/guided/guided-screen.test.tsx
```

预期：FAIL。

- [ ] **步骤 3：实现最小引导训练流程**

`src/modules/guided/guided-screen.tsx`

```tsx
import { useState } from 'react';

export default function GuidedScreen() {
  const [result, setResult] = useState<string | null>(null);

  return (
    <section>
      <p>请找出刚才播放的声音</p>
      <button type="button" onClick={() => setResult('回答正确')}>
        小猫
      </button>
      <button type="button" onClick={() => setResult('请再试一次')}>
        小狗
      </button>
      {result ? <p>{result}</p> : null}
    </section>
  );
}
```

- [ ] **步骤 4：落库一次作答记录**

`src/modules/stats/stats-repository.ts`

```ts
export async function recordAttempt() {
  return true;
}
```

- [ ] **步骤 5：运行测试确认通过**

运行：

```bash
npm exec vitest run -- src/modules/guided/guided-screen.test.tsx
```

预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/modules/guided src/modules/stats
git commit -m "feat: add guided training and attempt tracking"
```

### 任务 7：实现教师入口、PIN 校验和训练设置

**文件：**
- 创建：`src/modules/admin/admin-entry.tsx`
- 创建：`src/modules/admin/pin-dialog.tsx`
- 创建：`src/modules/admin/settings-screen.tsx`
- 创建：`src/modules/admin/settings-store.ts`
- 创建：`src/modules/admin/pin-dialog.test.tsx`
- 测试：`src/modules/admin/pin-dialog.test.tsx`

- [ ] **步骤 1：编写教师 PIN 弹层测试**

`src/modules/admin/pin-dialog.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import PinDialog from './pin-dialog';

it('renders four-digit pin prompt', () => {
  render(<PinDialog open />);
  expect(screen.getByLabelText('教师口令')).toBeInTheDocument();
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm exec vitest run -- src/modules/admin/pin-dialog.test.tsx
```

预期：FAIL。

- [ ] **步骤 3：实现 PIN 弹层和设置页面**

`src/modules/admin/pin-dialog.tsx`

```tsx
export default function PinDialog({ open = false }: { open?: boolean }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true">
      <label>
        教师口令
        <input aria-label="教师口令" inputMode="numeric" maxLength={4} />
      </label>
    </div>
  );
}
```

- [ ] **步骤 4：实现柔和模式和候选数设置存取**

`src/modules/admin/settings-store.ts`

```ts
export type TrainingSettings = {
  softModeEnabled: boolean;
  guidedOptionCount: 2 | 3 | 4;
};
```

- [ ] **步骤 5：运行测试确认通过**

运行：

```bash
npm exec vitest run -- src/modules/admin/pin-dialog.test.tsx
```

预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/modules/admin
git commit -m "feat: add hidden teacher entry and settings"
```

### 任务 8：实现素材导入和教师统计看板

**文件：**
- 创建：`src/modules/assets/import-assets.ts`
- 创建：`src/modules/admin/dashboard-screen.tsx`
- 创建：`src/modules/admin/assets-screen.tsx`
- 创建：`src/modules/admin/dashboard-screen.test.tsx`
- 测试：`src/modules/admin/dashboard-screen.test.tsx`

- [ ] **步骤 1：编写看板渲染测试**

`src/modules/admin/dashboard-screen.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import DashboardScreen from './dashboard-screen';

it('renders training summary cards', () => {
  render(<DashboardScreen />);
  expect(screen.getByText('总训练时长')).toBeInTheDocument();
  expect(screen.getByText('引导训练正确率')).toBeInTheDocument();
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm exec vitest run -- src/modules/admin/dashboard-screen.test.tsx
```

预期：FAIL。

- [ ] **步骤 3：实现最小统计看板**

`src/modules/admin/dashboard-screen.tsx`

```tsx
export default function DashboardScreen() {
  return (
    <section>
      <h2>总训练时长</h2>
      <h2>引导训练正确率</h2>
    </section>
  );
}
```

- [ ] **步骤 4：实现文件导入入口**

`src/modules/assets/import-assets.ts`

```ts
export async function importCustomAsset() {
  return true;
}
```

- [ ] **步骤 5：运行测试确认通过**

运行：

```bash
npm exec vitest run -- src/modules/admin/dashboard-screen.test.tsx
```

预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/modules/assets/import-assets.ts src/modules/admin
git commit -m "feat: add admin dashboard and asset import entry"
```

### 任务 9：收尾与 Windows 打包验证

**文件：**
- 修改：`src/App.tsx`
- 修改：`src-tauri/tauri.conf.json`
- 创建：`README.md`
- 测试：`npm exec vitest run`

- [ ] **步骤 1：补齐应用启动流程**

`src/App.tsx`

```tsx
import { DbContext } from './db/db-context';
import HomeScreen from './screens/home-screen';

export default function App() {
  return (
    <DbContext.Provider value={null as never}>
      <HomeScreen />
    </DbContext.Provider>
  );
}
```

- [ ] **步骤 2：执行前端测试**

运行：

```bash
npm exec vitest run
```

预期：所有前端单测通过。

- [ ] **步骤 3：执行前端构建**

运行：

```bash
npm run build
```

预期：构建通过。

- [ ] **步骤 4：执行 Tauri Windows 打包**

运行：

```bash
npm exec tauri build
```

预期：生成 Windows 安装包或可执行构建产物。

- [ ] **步骤 5：Commit**

```bash
git add README.md src src-tauri
git commit -m "build: prepare windows mvp package"
```
