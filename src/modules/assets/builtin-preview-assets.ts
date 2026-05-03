import catalog from '../../../AIimages/builtin-image-expansion-catalog.json'
import type { AssetCategory, BuiltinAssetDefinition } from './asset-repository'

type ExpansionCatalogAsset = {
  category: string
  id: string
  plannedAudio: string
  plannedImage: string
  title: string
}

type ExpansionCatalog = {
  assets: ExpansionCatalogAsset[]
}

export type BuiltinPreviewAsset = BuiltinAssetDefinition & {
  audioReady: false
}

function normalizeCategory(category: string): AssetCategory {
  switch (category) {
    case 'animals':
    case 'nature':
    case 'transport':
    case 'instruments':
    case 'daily_life':
      return category
    default:
      throw new Error(`Unsupported preview asset category: ${category}`)
  }
}

export const builtinPreviewAssets: BuiltinPreviewAsset[] = (
  catalog as ExpansionCatalog
).assets.map((asset) => ({
  audio: asset.plannedAudio,
  audioReady: false,
  category: normalizeCategory(asset.category),
  id: asset.id,
  image: asset.plannedImage,
  title: asset.title,
}))
