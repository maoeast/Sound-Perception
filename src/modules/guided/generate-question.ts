import type { BuiltinAssetDefinition } from '../assets/asset-repository'

export type GuidedAsset = BuiltinAssetDefinition

export type GuidedQuestion = {
  candidates: GuidedAsset[]
  target: GuidedAsset
}

type RandomSource = () => number
type GenerateQuestionOptions = {
  target?: GuidedAsset
}

function clampOptionCount(optionCount: number, totalAssets: number) {
  const upperBound = Math.min(Math.max(totalAssets, 1), 4)

  return Math.min(Math.max(optionCount, 1), upperBound)
}

function takeRandomAsset<T>(items: T[], random: RandomSource) {
  const index = Math.floor(random() * items.length)
  return items.splice(index, 1)[0]
}

function shuffleAssets<T>(items: T[], random: RandomSource) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

export function generateQuestion(
  assets: GuidedAsset[],
  optionCount: number,
  random: RandomSource = Math.random,
  options: GenerateQuestionOptions = {},
): GuidedQuestion {
  if (assets.length === 0) {
    throw new Error('At least one asset is required to generate a guided question')
  }

  const safeOptionCount = clampOptionCount(optionCount, assets.length)
  const availableAssets = [...assets]
  let target: GuidedAsset | undefined

  if (options.target) {
    const targetIndex = availableAssets.findIndex(
      (asset) => asset.id === options.target?.id,
    )

    if (targetIndex >= 0) {
      target = availableAssets.splice(targetIndex, 1)[0]
    }
  } else {
    target = takeRandomAsset(availableAssets, random)
  }
  const distractors: GuidedAsset[] = []

  if (!target) {
    throw new Error('The provided guided target must exist in the current asset pool')
  }

  while (
    distractors.length < safeOptionCount - 1 &&
    availableAssets.length > 0
  ) {
    const distractor = takeRandomAsset(availableAssets, random)

    if (distractor) {
      distractors.push(distractor)
    }
  }

  return {
    candidates: shuffleAssets([target, ...distractors], random),
    target,
  }
}
