import ActionButtonLabel from '../components/ui/action-button-label'
import PrimaryTile from '../components/ui/primary-tile'
import { DEFAULT_APP_TITLE } from '../config/app-settings'

type HomeScreenProps = {
  appTitle?: string
  exitHint?: string
  onExitApp?: () => void
  onOpenAdmin?: () => void
  onOpenExplore?: () => void
  onOpenGuided?: () => void
}

const noop = () => {}

export default function HomeScreen({
  appTitle = DEFAULT_APP_TITLE,
  exitHint,
  onExitApp = noop,
  onOpenAdmin = noop,
  onOpenExplore = noop,
  onOpenGuided = noop,
}: HomeScreenProps) {
  return (
    <main className="app-shell">
      <section
        className="screen-panel screen-panel--home screen-panel--home--illustrated screen-panel--home--illustrated-strong"
        data-testid="home-panel"
      >
        <div className="home-utility-bar">
          <button
            className="secondary-action secondary-action--quiet home-exit-button"
            onClick={onExitApp}
            type="button"
          >
            <ActionButtonLabel icon="exit-app" text="退出应用" />
          </button>
        </div>

        <div className="hero-copy" data-testid="home-hero">
          <h1 className="hero-copy__title hero-copy__title--cyan">{appTitle}</h1>
        </div>

        <div
          className="home-actions"
          data-testid="home-action-grid"
          role="group"
          aria-label="训练模式"
        >
          <PrimaryTile
            description="点击图片并立即播放声音，适合建立基础认知。"
            icon="explore"
            onClick={onOpenExplore}
            title="自由探索"
            tone="blue"
          />
          <PrimaryTile
            description="听声音后在候选项里做匹配，适合进入结构化训练。"
            icon="guided"
            onClick={onOpenGuided}
            title="引导训练"
            tone="orange"
          />
        </div>

        <div className="home-footer">
          <button
            className="secondary-action secondary-action--quiet home-admin-entry"
            onClick={onOpenAdmin}
            type="button"
          >
            <ActionButtonLabel icon="teacher-entry" text="教师入口" />
          </button>

          {exitHint ? (
            <p className="home-footer__hint" role="status">
              {exitHint}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
