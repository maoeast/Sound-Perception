import ExploreTrainingScreen from '../modules/explore/explore-screen'
import type { ExploreAsset } from '../modules/explore/use-explore-session'

type ExploreScreenProps = {
  assets?: ExploreAsset[]
  onBackHome?: () => void
}

const noop = () => {}

export default function ExploreScreen({
  assets,
  onBackHome = noop,
}: ExploreScreenProps) {
  return <ExploreTrainingScreen assets={assets} onBackHome={onBackHome} />
}
