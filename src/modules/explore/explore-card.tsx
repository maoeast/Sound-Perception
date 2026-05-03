import AssetArtwork from '../assets/asset-artwork'
import type { BuiltinAssetDefinition } from '../assets/asset-repository'

type ExploreCardProps = {
  asset: BuiltinAssetDefinition
  isPlaying?: boolean
  onPlay: (asset: BuiltinAssetDefinition) => Promise<void>
}

export default function ExploreCard({
  asset,
  isPlaying = false,
  onPlay,
}: ExploreCardProps) {
  const isAudioReady =
    asset.audioReady !== false && asset.audio.trim().length > 0

  return (
    <button
      aria-label={asset.title}
      className="explore-card"
      data-audio-ready={isAudioReady ? 'true' : 'false'}
      data-playing={isPlaying ? 'true' : 'false'}
      disabled={!isAudioReady}
      onClick={() => void onPlay(asset)}
      type="button"
    >
      <div className="explore-card__media">
        <AssetArtwork
          className="explore-card__image"
          fallbackClassName="explore-card__badge"
          imagePath={asset.image}
          title={asset.title}
        />
      </div>

      <span className="explore-card__meta explore-card__meta--simple">
        <span className="explore-card__title">{asset.title}</span>
        {!isAudioReady ? (
          <span className="explore-card__availability">待补音频</span>
        ) : null}
      </span>
    </button>
  )
}
