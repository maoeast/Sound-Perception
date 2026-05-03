import { useEffect, useRef, useState } from 'react'
import builtinAssets from '../../assets/manifest/builtin-assets.json'
import {
  getAudioEngine,
  type AudioEngineLike,
  type PlayableAsset,
} from '../../audio/audio-engine'
import { type UiSoundPlayerLike } from '../../audio/ui-sound-player'
import type { BuiltinAssetDefinition } from '../assets/asset-repository'
import {
  getStatsRepository,
  type StartedTrainingSession,
  type StatsRepository,
} from '../stats/stats-repository'
import {
  generateQuestion,
  type GuidedAsset,
  type GuidedQuestion,
} from './generate-question'

export type { GuidedAsset, GuidedQuestion, StartedTrainingSession }
export type GuidedStatsRepository = StatsRepository
export const GUIDED_CORRECT_FEEDBACK_AUDIO_PATH = 'ui-feedback/correct-answer.wav'
export const GUIDED_INCORRECT_FEEDBACK_AUDIO_PATH = 'ui-feedback/wrong-answer.wav'
const GUIDED_CORRECT_FEEDBACK_ASSET_ID = 'guided-feedback-correct'
const GUIDED_INCORRECT_FEEDBACK_ASSET_ID = 'guided-feedback-incorrect'
const GUIDED_CORRECT_FEEDBACK_TITLE = '回答正确提示音'
const GUIDED_INCORRECT_FEEDBACK_TITLE = '回答错误提示音'

type GuidedFeedback = 'correct' | 'incorrect' | null
type GuidedRoundState = {
  question: GuidedQuestion
  remainingTargetIds: string[]
}

type UseGuidedSessionOptions = {
  assets?: GuidedAsset[]
  audioEngine?: AudioEngineLike
  feedbackAudioPlayer?: UiSoundPlayerLike
  optionCount?: number
  random?: () => number
  statsRepository?: GuidedStatsRepository
}

const BUILTIN_GUIDED_ASSETS = builtinAssets as BuiltinAssetDefinition[]

function isGuidedReadyAsset(asset: GuidedAsset) {
  return asset.audioReady !== false && asset.audio.trim().length > 0
}

function toPlayableAsset(asset: GuidedAsset): PlayableAsset {
  return {
    audioPath: asset.audio,
    id: asset.id,
    title: asset.title,
  }
}

function takeNextRoundTarget(
  assets: GuidedAsset[],
  remainingTargetIds: string[],
  random: () => number,
) {
  const availableTargetIds = new Set(assets.map((asset) => asset.id))
  const nextRoundTargetIds = remainingTargetIds.filter((id) => availableTargetIds.has(id))

  if (nextRoundTargetIds.length === 0) {
    nextRoundTargetIds.push(...assets.map((asset) => asset.id))
  }

  const targetIndex = Math.floor(random() * nextRoundTargetIds.length)
  const [targetId] = nextRoundTargetIds.splice(targetIndex, 1)
  const target = assets.find((asset) => asset.id === targetId)

  if (!target) {
    throw new Error('At least one guided asset is required to continue the training round')
  }

  remainingTargetIds.splice(0, remainingTargetIds.length, ...nextRoundTargetIds)

  return target
}

function createNextRoundState(
  assets: GuidedAsset[],
  optionCount: number,
  random: () => number,
  remainingTargetIds: string[] = [],
): GuidedRoundState {
  const nextRemainingTargetIds = [...remainingTargetIds]
  const target = takeNextRoundTarget(assets, nextRemainingTargetIds, random)

  return {
    question: generateQuestion(assets, optionCount, random, { target }),
    remainingTargetIds: nextRemainingTargetIds,
  }
}

function createFeedbackAudioPlayer(audioEngine: AudioEngineLike): UiSoundPlayerLike {
  return {
    async play(audioPath: string) {
      const isCorrectFeedback = audioPath === GUIDED_CORRECT_FEEDBACK_AUDIO_PATH

      await audioEngine.playAsset({
        audioPath,
        id: isCorrectFeedback
          ? GUIDED_CORRECT_FEEDBACK_ASSET_ID
          : GUIDED_INCORRECT_FEEDBACK_ASSET_ID,
        title: isCorrectFeedback
          ? GUIDED_CORRECT_FEEDBACK_TITLE
          : GUIDED_INCORRECT_FEEDBACK_TITLE,
      })
    },
  }
}

export function useGuidedSession(
  options: UseGuidedSessionOptions = {},
) {
  const {
    assets = BUILTIN_GUIDED_ASSETS,
    audioEngine = getAudioEngine(),
    feedbackAudioPlayer,
    optionCount = 4,
    random = Math.random,
    statsRepository = getStatsRepository(),
  } = options
  const resolvedFeedbackAudioPlayer =
    feedbackAudioPlayer ?? createFeedbackAudioPlayer(audioEngine)
  const availableAssets = assets.filter(isGuidedReadyAsset)
  const guidedAssets =
    availableAssets.length > 0 ? availableAssets : BUILTIN_GUIDED_ASSETS
  const [roundState, setRoundState] = useState<GuidedRoundState>(() =>
    createNextRoundState(guidedAssets, optionCount, random),
  )
  const [feedback, setFeedback] = useState<GuidedFeedback>(null)
  const [isResolvingAnswer, setIsResolvingAnswer] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [session, setSession] = useState<StartedTrainingSession | null>(null)
  const isMountedRef = useRef(true)
  const sessionRef = useRef<StartedTrainingSession | null>(null)
  const question = roundState.question

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let active = true

    void (async () => {
      const startedSession = await statsRepository.startSession({
        mode: 'guided',
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

  useEffect(() => {
    if (!session) {
      return
    }

    const targetAsset = question.target

    void (async () => {
      try {
        await audioEngine.playAsset(toPlayableAsset(targetAsset))
      } catch {
        // UI feedback still works when audio assets are not present yet.
      }

      try {
        await statsRepository.recordInteractionEvent({
          assetId: targetAsset.id,
          eventType: 'play',
          sessionId: session.id,
        })
      } catch {
        // Stats failures must not block the training loop.
      }
    })()
  }, [audioEngine, question, session, statsRepository])

  async function replayTargetSound() {
    if (!session) {
      return
    }

    try {
      await audioEngine.playAsset(toPlayableAsset(question.target))
    } catch {
      // UI feedback still works when audio assets are not present yet.
    }

    try {
      await statsRepository.recordInteractionEvent({
        assetId: question.target.id,
        eventType: 'replay',
        sessionId: session.id,
      })
    } catch {
      // Stats failures must not block the training loop.
    }
  }

  async function submitAnswer(asset: GuidedAsset) {
    if (!session || isResolvingAnswer) {
      return
    }

    const isCorrect = asset.id === question.target.id
    const feedbackAudioPath = isCorrect
      ? GUIDED_CORRECT_FEEDBACK_AUDIO_PATH
      : GUIDED_INCORRECT_FEEDBACK_AUDIO_PATH

    setIsResolvingAnswer(true)
    setSelectedAssetId(asset.id)
    setFeedback(isCorrect ? 'correct' : 'incorrect')

    const feedbackPromise = resolvedFeedbackAudioPlayer.play(feedbackAudioPath).catch(() => {
      // Feedback audio failures must not block the guided flow.
    })

    void (async () => {
      try {
        await statsRepository.recordAttempt({
          candidateAssetIds: question.candidates.map((candidate) => candidate.id),
          isCorrect,
          selectedAssetId: asset.id,
          sessionId: session.id,
          targetAssetId: question.target.id,
        })
      } catch {
        // Stats failures must not block the training loop.
      }

      if (isCorrect) {
        try {
          await statsRepository.recordInteractionEvent({
            assetId: question.target.id,
            eventType: 'complete',
            sessionId: session.id,
          })
        } catch {
          // Stats failures must not block the training loop.
        }
      }
    })()

    await feedbackPromise

    if (!isMountedRef.current) {
      return
    }

    if (isCorrect) {
      setFeedback(null)
      setSelectedAssetId(null)
      setRoundState((currentRoundState) =>
        createNextRoundState(
          guidedAssets,
          optionCount,
          random,
          currentRoundState.remainingTargetIds,
        ),
      )
    }

    setIsResolvingAnswer(false)
  }

  function getChoiceState(assetId: string) {
    if (feedback === 'correct' && assetId === question.target.id) {
      return 'correct'
    }

    if (feedback === 'incorrect' && assetId === selectedAssetId) {
      return 'incorrect'
    }

    return 'idle'
  }

  return {
    feedback,
    question,
    replayTargetSound,
    selectedAssetId,
    sessionReady: session !== null && !isResolvingAnswer,
    submitAnswer,
    targetTitle: question.target.title,
    getChoiceState,
  }
}
