import type { Database, QueryValue } from 'sql.js'
import {
  DEFAULT_APP_TITLE,
  normalizeAppTitle,
} from '../../config/app-settings'
import {
  createAppDatabase,
  exportDatabaseBinary,
} from '../../db/db-client'
import { ensureBuiltinAssetsSeeded } from '../assets/bootstrap-assets'

export type TrainingSettings = {
  appTitle: string
  fullscreenEnabled: boolean
  guidedOptionCount: 2 | 3 | 4
  softModeEnabled: boolean
}

export type AdminSettingsStore = {
  loadTrainingSettings(): Promise<TrainingSettings>
  saveTrainingSettings(settings: TrainingSettings): Promise<void>
  verifyTeacherPin(pin: string): Promise<boolean>
}

type CreateSettingsStoreOptions = {
  database?: Database
  saveSnapshot?: (binary: Uint8Array) => Promise<void>
}

function normalizeGuidedOptionCount(value: unknown): 2 | 3 | 4 {
  const numericValue = Number(value)

  if (numericValue === 3 || numericValue === 4) {
    return numericValue
  }

  return 2
}

function toBooleanFlag(value: unknown) {
  return Number(value) === 1
}

async function safelyLoadSnapshot() {
  try {
    const { loadDatabaseBinary } = await import('../../db/db-storage')
    return await loadDatabaseBinary()
  } catch {
    return null
  }
}

async function safelySaveSnapshot(binary: Uint8Array) {
  try {
    const { saveDatabaseBinary } = await import('../../db/db-storage')
    await saveDatabaseBinary(binary)
  } catch {
    // Browser-only preview and tests can run without the Tauri filesystem bridge.
  }
}

async function createRuntimeDatabase() {
  const binary = await safelyLoadSnapshot()
  const db = await createAppDatabase(binary ?? undefined)

  await ensureBuiltinAssetsSeeded({ db })

  return db
}

function readSettingsRow(db: Database) {
  const row = db.exec(
    `
      select
        teacher_pin_hash,
        app_title,
        soft_mode_enabled,
        guided_option_count,
        fullscreen_enabled
      from settings
      where id = 1
    `,
  )[0]?.values[0]

  if (!row) {
    throw new Error('Settings row is not initialized')
  }

  return row
}

export function createSettingsStore(
  options: CreateSettingsStoreOptions = {},
): AdminSettingsStore {
  const { database, saveSnapshot } = options
  let databasePromise: Promise<Database> | null = database
    ? Promise.resolve(database)
    : null

  async function getDatabase() {
    if (!databasePromise) {
      databasePromise = createRuntimeDatabase()
    }

    return databasePromise
  }

  async function persistDatabase() {
    const db = await getDatabase()
    const binary = exportDatabaseBinary(db)

    if (saveSnapshot) {
      await saveSnapshot(binary)
      return
    }

    await safelySaveSnapshot(binary)
  }

  return {
    async loadTrainingSettings() {
      const db = await getDatabase()
      const row = readSettingsRow(db)

      return {
        appTitle: normalizeAppTitle(row[1] ?? DEFAULT_APP_TITLE),
        fullscreenEnabled: toBooleanFlag(row[4]),
        guidedOptionCount: normalizeGuidedOptionCount(row[3]),
        softModeEnabled: toBooleanFlag(row[2]),
      }
    },

    async saveTrainingSettings(settings: TrainingSettings) {
      const db = await getDatabase()
      const normalizedTitle = normalizeAppTitle(settings.appTitle)

      db.run(
        `
          update settings
          set
            app_title = ?,
            soft_mode_enabled = ?,
            guided_option_count = ?,
            fullscreen_enabled = ?,
            updated_at = ?
          where id = 1
        `,
        [
          normalizedTitle,
          settings.softModeEnabled ? 1 : 0,
          settings.guidedOptionCount,
          settings.fullscreenEnabled ? 1 : 0,
          new Date().toISOString(),
        ] satisfies QueryValue[],
      )

      await persistDatabase()
    },

    async verifyTeacherPin(pin: string) {
      const db = await getDatabase()
      const row = readSettingsRow(db)

      return String(row[0] ?? '') === pin
    },
  }
}

const sharedSettingsStore = createSettingsStore()

export function getSettingsStore() {
  return sharedSettingsStore
}
