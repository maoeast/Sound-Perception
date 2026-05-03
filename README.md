# 特殊儿童声音感知训练

基于 `Tauri 2 + React + TypeScript + Vite` 的离线桌面应用 MVP，面向特殊儿童的声音认知与声音匹配训练场景。

## 当前状态

- 已实现 `44` 个正式内置素材：图片与音频均已接通，可直接进入训练
- 已实现 `自由探索模式`：分类卡片、即时播放状态与温和视觉反馈
- 已实现 `引导训练模式`：目标声音播放、候选卡片作答、正确/错误反馈与作答落库
- 已实现引导训练按轮次覆盖目标素材：当前轮次尽量先轮完一遍已启用素材，再开始下一轮
- 已实现 `隐藏教师入口 + 4 位 PIN`：右下角热区连续点击 `5` 次，默认口令 `0000`
- 已实现教师管理台的 `统计看板`、`训练设置` 与 `素材导入入口`
- 教师可修改 `软件标题`、`柔和模式`、`引导训练候选项数量` 与 `训练界面默认全屏`
- 已接入 `sql.js` 本地数据库启动初始化、默认素材首启导入与项目内持久化

## 本地开发

先启用项目内 Node 环境：

```bash
source ./scripts/use-node-env.sh
```

如果要在这个目录里直接使用 Git，再额外启用一次 Git 环境：

```bash
source ./scripts/use-git-env.sh
```

启用后就可以正常执行：

```bash
git status
git pull --rebase
git push
```

启动前端开发服务器：

```bash
npm run dev
```

启动 Tauri 桌面开发：

```bash
npm run tauri -- dev
```

构建前端：

```bash
npm run build
```

构建 Tauri 桌面安装包：

```bash
npm run tauri -- build
```

运行 Lint：

```bash
npm run lint
```

## 教师入口

- 训练界面右下角有隐藏热区，连续点击 `5` 次会弹出教师 PIN 输入层
- 默认教师口令为 `0000`
- 进入教师管理台后可查看统计、修改软件标题、调整柔和模式/候选项数量/默认全屏，并导入自定义素材

## 数据与素材

- 默认素材清单位于 `src/assets/manifest/builtin-assets.json`，当前共 `44` 项正式内置素材
- 内置图片与音频资源位于 `public/builtin/`
- `sql.js` wasm 位于 `public/sql-wasm/sql-wasm.wasm`
- 运行时数据库快照写入 `AppLocalData/database/app.db`
- 教师导入素材时需要选择 `1` 张图片和 `1` 段音频；桌面端会复制到 `AppLocalData/assets/custom/`
