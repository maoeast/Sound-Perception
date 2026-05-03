import { type AudioEngineLike } from '../../audio/audio-engine'
import { type UiSoundPlayerLike } from '../../audio/ui-sound-player'
import ActionButtonLabel from '../../components/ui/action-button-label'
import AssetArtwork from '../assets/asset-artwork'
import type { GuidedAsset, GuidedStatsRepository } from './use-guided-session'
import { useGuidedSession } from './use-guided-session'

type GuidedScreenProps = {
  assets?: GuidedAsset[]
  audioEngine?: AudioEngineLike
  feedbackAudioPlayer?: UiSoundPlayerLike
  onBackHome?: () => void
  optionCount?: number
  random?: () => number
  statsRepository?: GuidedStatsRepository
}

const noop = () => {}

export default function GuidedScreen({
  assets,
  audioEngine,
  feedbackAudioPlayer,
  onBackHome = noop,
  optionCount,
  random,
  statsRepository,
}: GuidedScreenProps) {
  const {
    feedback,
    getChoiceState,
    question,
    replayTargetSound,
    sessionReady,
    submitAnswer,
  } = useGuidedSession({
    assets,
    audioEngine,
    feedbackAudioPlayer,
    optionCount,
    random,
    statsRepository,
  })

  const feedbackMessage =
    feedback === 'correct'
      ? '回答正确'
      : feedback === 'incorrect'
        ? '请再试一次'
        : '听一听，再点击对应的卡片'

  return (
    <main className="app-shell">
      <section className="screen-panel screen-panel--detail screen-panel--guided">
        <div className="guided-toolbar">
          <div className="guided-toolbar__copy">
            <p className="section-eyebrow">训练模式</p>
            <h1>引导训练模式</h1>
          </div>

          <button className="secondary-action" onClick={onBackHome} type="button">
            <ActionButtonLabel icon="back-home" text="返回主页" />
          </button>
        </div>

        <div className="guided-controls">
          <p className="guided-prompt">请找出刚才播放的声音</p>
          <button
            className="secondary-action guided-replay"
            disabled={!sessionReady}
            onClick={() => void replayTargetSound()}
            type="button"
          >
            重新播放声音
          </button>
        </div>

        <div className="guided-status-stack">
          <p
            className={`guided-feedback guided-feedback--${feedback ?? 'idle'}`}
            role="status"
          >
            {feedbackMessage}
          </p>
        </div>

        <div
          aria-label="引导训练候选项"
          className="guided-grid"
          data-option-count={String(question.candidates.length)}
          data-testid="guided-grid"
        >
          {question.candidates.map((asset) => (
            (() => {
              const choiceState = getChoiceState(asset.id)

              return (
                <button
                  aria-label={asset.title}
                  className={`guided-choice${choiceState === 'incorrect' ? ' guided-choice--incorrect-animated' : ''}`}
                  data-state={choiceState}
                  disabled={!sessionReady}
                  key={asset.id}
                  onClick={() => void submitAnswer(asset)}
                  type="button"
                >
                  <div className="guided-choice__media">
                    <AssetArtwork
                      className="guided-choice__image"
                      fallbackClassName="guided-choice__badge"
                      imagePath={asset.image}
                      title={asset.title}
                    />
                  </div>

                  <span className="guided-choice__meta guided-choice__meta--simple">
                    <span className="guided-choice__title">{asset.title}</span>
                  </span>
                </button>
              )
            })()
          ))}
        </div>
      </section>
    </main>
  )
}
