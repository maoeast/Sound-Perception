import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import type { Database } from 'sql.js'
import AdminEntry from '../modules/admin/admin-entry'
import { DEFAULT_APP_TITLE } from '../config/app-settings'
import { readEnabledAssets } from '../modules/assets/asset-repository'
import {
  createSettingsStore,
  getSettingsStore,
  type TrainingSettings,
} from '../modules/admin/settings-store'
import AdminShell from '../screens/admin-shell'
import ExploreScreen from '../screens/explore-screen'
import GuidedScreen from '../screens/guided-screen'
import HomeScreen from '../screens/home-screen'

type RouteId = 'home' | 'explore' | 'guided' | 'admin'

type AppRouterProps = {
  database?: Database
}

function hasTauriWindowRuntime() {
  if (typeof window === 'undefined') {
    return false
  }

  return '__TAURI_INTERNALS__' in window
}

export default function AppRouter({ database }: AppRouterProps) {
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE)
  const [exitHint, setExitHint] = useState<string | null>(null)
  const [guidedOptionCount, setGuidedOptionCount] = useState<2 | 3 | 4>(4)
  const [route, setRoute] = useState<RouteId>('home')
  const availableAssets = database ? readEnabledAssets(database) : undefined
  const settingsStore = useMemo(
    () => (database ? createSettingsStore({ database }) : getSettingsStore()),
    [database],
  )
  let screen: ReactNode

  function openHome() {
    setExitHint(null)
    setRoute('home')
  }

  function openAdmin() {
    setExitHint(null)
    setRoute('admin')
  }

  const applyTrainingSettings = useCallback((settings: TrainingSettings) => {
    setAppTitle(settings.appTitle)
    setGuidedOptionCount(settings.guidedOptionCount)
  }, [])

  const refreshTrainingSettings = useCallback(async () => {
    try {
      const settings = await settingsStore.loadTrainingSettings()
      applyTrainingSettings(settings)
      return settings
    } catch {
      setAppTitle(DEFAULT_APP_TITLE)
      setGuidedOptionCount(4)
      return null
    }
  }, [applyTrainingSettings, settingsStore])

  useEffect(() => {
    void refreshTrainingSettings()
  }, [refreshTrainingSettings])

  useEffect(() => {
    document.title = appTitle

    if (!isTauri()) {
      return
    }

    void (async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().setTitle(appTitle)
    })().catch(() => {
      // Browser preview and tests can continue without desktop shell APIs.
    })
  }, [appTitle])

  async function openGuided() {
    setExitHint(null)
    await refreshTrainingSettings()
    setRoute('guided')
  }

  async function handleExitApp() {
    if (!isTauri() && !hasTauriWindowRuntime()) {
      setExitHint('预览模式不能退出应用')
      return
    }

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().close()
    } catch {
      setExitHint('当前环境未授权关闭应用')
    }
  }

  switch (route) {
    case 'explore':
      screen = (
        <ExploreScreen
          assets={availableAssets}
          onBackHome={openHome}
        />
      )
      break
    case 'guided':
      screen = (
        <GuidedScreen
          assets={availableAssets}
          onBackHome={openHome}
          optionCount={guidedOptionCount}
        />
      )
      break
    case 'admin':
      return (
        <AdminShell
          database={database}
          onBackHome={openHome}
          onSettingsSaved={applyTrainingSettings}
          settingsStore={settingsStore}
        />
      )
    case 'home':
    default:
      screen = (
        <HomeScreen
          appTitle={appTitle}
          exitHint={exitHint ?? undefined}
          onExitApp={() => void handleExitApp()}
          onOpenAdmin={openAdmin}
          onOpenExplore={() => {
            setExitHint(null)
            setRoute('explore')
          }}
          onOpenGuided={() => void openGuided()}
        />
      )
      break
  }

  return (
    <>
      {screen}
      <AdminEntry onUnlocked={openAdmin} settingsStore={settingsStore} />
    </>
  )
}
