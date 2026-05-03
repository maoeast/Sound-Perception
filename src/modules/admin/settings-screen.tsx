import { useEffect, useState, type FormEvent } from 'react'
import type { Database } from 'sql.js'
import ActionButtonLabel from '../../components/ui/action-button-label'
import { normalizeAppTitle } from '../../config/app-settings'
import AssetsScreen from './assets-screen'
import DashboardScreen from './dashboard-screen'
import {
  getSettingsStore,
  type AdminSettingsStore,
  type TrainingSettings,
} from './settings-store'

type SettingsScreenProps = {
  database?: Database
  onBackHome?: () => void
  onSettingsSaved?: (settings: TrainingSettings) => void | Promise<void>
  settingsStore?: AdminSettingsStore
}

const noop = () => {}

export default function SettingsScreen({
  database,
  onBackHome = noop,
  onSettingsSaved,
  settingsStore = getSettingsStore(),
}: SettingsScreenProps) {
  const [settings, setSettings] = useState<TrainingSettings | null>(null)
  const [statusMessage, setStatusMessage] = useState('正在加载训练设置...')

  useEffect(() => {
    let active = true

    void (async () => {
      const loadedSettings = await settingsStore.loadTrainingSettings()

      if (!active) {
        return
      }

      setSettings(loadedSettings)
      setStatusMessage('修改后点击保存即可生效。')
    })()

    return () => {
      active = false
    }
  }, [settingsStore])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!settings) {
      return
    }

    const normalizedSettings = {
      ...settings,
      appTitle: normalizeAppTitle(settings.appTitle),
    }

    await settingsStore.saveTrainingSettings(normalizedSettings)
    setSettings(normalizedSettings)

    if (onSettingsSaved) {
      await onSettingsSaved(normalizedSettings)
    }

    setStatusMessage('设置已保存。')
  }

  return (
    <main className="app-shell">
      <section className="screen-panel screen-panel--detail screen-panel--settings">
        <div className="settings-toolbar">
          <div className="settings-toolbar__copy">
            <p className="section-eyebrow">教师管理</p>
            <h1>教师管理台</h1>
          </div>

          <button className="secondary-action" onClick={onBackHome} type="button">
            <ActionButtonLabel icon="back-home" text="返回主页" />
          </button>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>
          <DashboardScreen />

          <label className="settings-field">
            <span className="settings-field__label">软件应用标题</span>
            <input
              disabled={!settings}
              onChange={(event) => {
                setSettings((currentSettings) =>
                  currentSettings
                    ? {
                        ...currentSettings,
                        appTitle: event.target.value,
                      }
                    : currentSettings,
                )
              }}
              placeholder="例如：特殊儿童声音感知训练"
              type="text"
              value={settings?.appTitle ?? ''}
            />
          </label>

          <label className="settings-field settings-field--toggle">
            <span className="settings-field__label">柔和模式</span>
            <input
              checked={settings?.softModeEnabled ?? false}
              disabled={!settings}
              onChange={(event) => {
                setSettings((currentSettings) =>
                  currentSettings
                    ? {
                        ...currentSettings,
                        softModeEnabled: event.target.checked,
                      }
                    : currentSettings,
                )
              }}
              type="checkbox"
            />
          </label>

          <label className="settings-field">
            <span className="settings-field__label">引导训练候选项数量</span>
            <select
              disabled={!settings}
              onChange={(event) => {
                const nextValue = Number(event.target.value) as 2 | 3 | 4

                setSettings((currentSettings) =>
                  currentSettings
                    ? {
                        ...currentSettings,
                        guidedOptionCount: nextValue,
                      }
                    : currentSettings,
                )
              }}
              value={settings?.guidedOptionCount ?? 2}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>

          <label className="settings-field settings-field--toggle">
            <span className="settings-field__label">训练界面默认全屏</span>
            <input
              checked={settings?.fullscreenEnabled ?? false}
              disabled={!settings}
              onChange={(event) => {
                setSettings((currentSettings) =>
                  currentSettings
                    ? {
                        ...currentSettings,
                        fullscreenEnabled: event.target.checked,
                      }
                    : currentSettings,
                )
              }}
              type="checkbox"
            />
          </label>

          <p className="settings-status" role="status">
            {statusMessage}
          </p>

          <button className="primary-action" disabled={!settings} type="submit">
            保存设置
          </button>
        </form>

        <AssetsScreen database={database} />
      </section>
    </main>
  )
}
