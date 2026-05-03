import { type AudioEngineLike } from '../../audio/audio-engine'
import ActionButtonLabel from '../../components/ui/action-button-label'
import { type StatsRepository } from '../stats/stats-repository'
import ExploreCard from './explore-card'
import {
  CATEGORY_LABELS,
  type ExploreAsset,
  useExploreSession,
} from './use-explore-session'

type ExploreScreenProps = {
  assets?: ExploreAsset[]
  audioEngine?: AudioEngineLike
  onBackHome?: () => void
  statsRepository?: StatsRepository
}

const noop = () => {}

export default function ExploreScreen({
  assets,
  audioEngine,
  onBackHome = noop,
  statsRepository,
}: ExploreScreenProps) {
  const {
    activeCategory,
    categories,
    playingAsset,
    playAsset,
    selectCategory,
    visibleAssets,
  } = useExploreSession({ assets, audioEngine, statsRepository })
  const hasPreviewOnlyAssets = visibleAssets.some(
    (asset) => asset.audioReady === false || asset.audio.trim().length === 0,
  )

  return (
    <main className="app-shell">
      <section className="screen-panel screen-panel--detail screen-panel--explore">
        <div className="explore-toolbar">
          <div className="explore-toolbar__copy">
            <p className="section-eyebrow">训练模式</p>
            <h1>自由探索模式</h1>
          </div>

          <button className="secondary-action" onClick={onBackHome} type="button">
            <ActionButtonLabel icon="back-home" text="返回主页" />
          </button>
        </div>

        <div aria-label="素材类别" className="explore-categories" role="group">
          {categories.map((category) => (
            <button
              aria-pressed={category === activeCategory}
              className={`category-chip${category === activeCategory ? ' category-chip--active' : ''}`}
              key={category}
              onClick={() => selectCategory(category)}
              type="button"
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <div className="explore-status-panel" data-testid="explore-status-panel">
          <p
            className={`explore-status${playingAsset ? '' : ' explore-status--idle'}`}
            role="status"
          >
            {playingAsset
              ? `正在播放：${playingAsset.title}`
              : `当前类别：${CATEGORY_LABELS[activeCategory]}，点击卡片播放声音`}
          </p>

          {hasPreviewOnlyAssets ? (
            <p className="asset-boundary-notice">
              标记“待补音频”的新卡片目前只展示图片，不播放声音，也不会进入引导训练。
            </p>
          ) : null}
        </div>

        <div
          aria-label={`${CATEGORY_LABELS[activeCategory]}素材列表`}
          className="explore-grid"
          data-layout="touch-grid"
          data-testid="explore-grid"
        >
          {visibleAssets.map((asset) => (
            <ExploreCard
              asset={asset}
              isPlaying={playingAsset?.id === asset.id}
              key={asset.id}
              onPlay={playAsset}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
