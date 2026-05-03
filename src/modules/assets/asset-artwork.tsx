import { useState } from 'react'

type AssetArtworkProps = {
  className: string
  fallbackClassName: string
  imagePath: string
  title: string
}

function normalizeAssetUrl(assetPath: string) {
  if (
    assetPath.startsWith('data:') ||
    assetPath.startsWith('blob:') ||
    assetPath.startsWith('http://') ||
    assetPath.startsWith('https://') ||
    assetPath.startsWith('asset:')
  ) {
    return assetPath
  }

  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`
}

export default function AssetArtwork({
  className,
  fallbackClassName,
  imagePath,
  title,
}: AssetArtworkProps) {
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  const hasLoadError = failedImagePath === imagePath

  if (hasLoadError) {
    return (
      <span aria-hidden="true" className={fallbackClassName}>
        {title.slice(0, 1)}
      </span>
    )
  }

  return (
    <img
      alt={`${title}插图`}
      className={className}
      loading="lazy"
      onError={() => setFailedImagePath(imagePath)}
      src={normalizeAssetUrl(imagePath)}
    />
  )
}
