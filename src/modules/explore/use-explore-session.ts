import { useEffect, useRef, useState } from 'react'
import builtinAssets from '../../assets/manifest/builtin-assets.json'
import {
  getAudioEngine,
  type AudioEngineLike,
  type PlayableAsset,
} from '../../audio/audio-engine'
import type {
  AssetCategory,
  BuiltinAssetDefinition,
} from '../assets/asset-repository'
import { builtinPreviewAssets } from '../assets/builtin-preview-assets'
import {
  getStatsRepository,
  type StartedTrainingSession,
  type StatsRepository,
} from '../stats/stats-repository'

export type ExploreAsset = BuiltinAssetDefinition

const CATEGORY_ORDER: AssetCategory[] = [
  'animals',
  'nature',
  'transport',
  'instruments',
  'daily_life',
]

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  animals: '动物',
  nature: '自然',
  transport: '交通',
  instruments: '乐器',
  daily_life: '日常生活',
}

function isAudioReadyAsset(asset: ExploreAsset) {
  return asset.audioReady !== false && asset.audio.trim().length > 0
}

const BUILTIN_EXPLORE_ASSETS: ExploreAsset[] = [
  ...(builtinAssets as BuiltinAssetDefinition[]).map((asset) => ({
    ...asset,
    audioReady: true,
  })),
  ...builtinPreviewAssets,
]

type UseExploreSessionOptions = {
  assets?: ExploreAsset[]
  audioEngine?: AudioEngineLike
  statsRepository?: StatsRepository
}

function toPlayableAsset(asset: ExploreAsset): PlayableAsset {
  return {
    audioPath: asset.audio,
    id: asset.id,
    title: asset.title,
  }
}

export function useExploreSession(
  options: UseExploreSessionOptions = {},
) {
  const {
    assets = BUILTIN_EXPLORE_ASSETS,
    audioEngine = getAudioEngine(),
    statsRepository = getStatsRepository(),
  } = options
  const availableCategories = CATEGORY_ORDER.filter((category) =>
    assets.some((asset) => asset.category === category),
  )
  const [activeCategory, setActiveCategory] = useState<AssetCategory>(
    availableCategories[0] ?? 'animals',
  )
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null)
  const [session, setSession] = useState<StartedTrainingSession | null>(null)
  const sessionRef = useRef<StartedTrainingSession | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      const startedSession = await statsRepository.startSession({
        mode: 'explore',
      })

      if (!active) {
        await statsRepository.completeSession(startedSession)
        return
      }

      sessionRef.current = startedSession
      setSession(startedSession)
    })()

    return () => {
      active = false

      if (sessionRef.current) {
        void statsRepository.completeSession(sessionRef.current)
        sessionRef.current = null
      }
    }
  }, [statsRepository])

  const visibleAssets = assets.filter(
    (asset) => asset.category === activeCategory,
  )
  const playingAsset =
    !playingAssetId
      ? null
      : assets.find((asset) => asset.id === playingAssetId) ?? null

  async function playAsset(asset: ExploreAsset) {
    if (!isAudioReadyAsset(asset)) {
      setPlayingAssetId(null)
      return
    }

    setPlayingAssetId(asset.id)
    await audioEngine.playAsset(toPlayableAsset(asset))

    if (!session) {
      return
    }

    try {
      await statsRepository.recordInteractionEvent({
        assetId: asset.id,
        eventType: 'play',
        sessionId: session.id,
      })
    } catch {
      // Stats failures must not block exploration feedback.
    }
  }

  function selectCategory(category: AssetCategory) {
    setActiveCategory(category)

    setPlayingAssetId((currentAssetId) => {
      const currentAsset = currentAssetId
        ? assets.find((asset) => asset.id === currentAssetId) ?? null
        : null

      if (!currentAsset || currentAsset.category !== category) {
        return null
      }

      return currentAssetId
    })
  }

  return {
    activeCategory,
    categories: availableCategories,
    playingAsset,
    playAsset,
    selectCategory,
    visibleAssets,
  }
}
