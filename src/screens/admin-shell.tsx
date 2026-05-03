import type { Database } from 'sql.js'
import SettingsScreen from '../modules/admin/settings-screen'
import type {
  AdminSettingsStore,
  TrainingSettings,
} from '../modules/admin/settings-store'

type AdminShellProps = {
  database?: Database
  onBackHome?: () => void
  onSettingsSaved?: (settings: TrainingSettings) => void | Promise<void>
  settingsStore?: AdminSettingsStore
}

const noop = () => {}

export default function AdminShell({
  database,
  onBackHome = noop,
  onSettingsSaved,
  settingsStore,
}: AdminShellProps) {
  return (
    <SettingsScreen
      database={database}
      onBackHome={onBackHome}
      onSettingsSaved={onSettingsSaved}
      settingsStore={settingsStore}
    />
  )
}
