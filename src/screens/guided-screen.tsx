import GuidedTrainingScreen from '../modules/guided/guided-screen'
import type { GuidedAsset } from '../modules/guided/use-guided-session'

type GuidedScreenProps = {
  assets?: GuidedAsset[]
  onBackHome?: () => void
  optionCount?: 2 | 3 | 4
}

const noop = () => {}

export default function GuidedScreen({
  assets,
  onBackHome = noop,
  optionCount,
}: GuidedScreenProps) {
  return (
    <GuidedTrainingScreen
      assets={assets}
      onBackHome={onBackHome}
      optionCount={optionCount}
    />
  )
}
