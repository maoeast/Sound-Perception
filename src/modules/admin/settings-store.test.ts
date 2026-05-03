// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createAppDatabase } from '../../db/db-client'
import { ensureBuiltinAssetsSeeded } from '../assets/bootstrap-assets'
import { createSettingsStore } from './settings-store'

describe('createSettingsStore', () => {
  it('loads defaults, persists updates, and verifies the teacher pin', async () => {
    const db = await createAppDatabase()
    await ensureBuiltinAssetsSeeded({ db })
    const settingsStore = createSettingsStore({
      database: db,
      saveSnapshot: vi.fn().mockResolvedValue(undefined),
    })

    expect(await settingsStore.loadTrainingSettings()).toEqual({
      appTitle: '特殊儿童声音感知训练',
      fullscreenEnabled: true,
      guidedOptionCount: 4,
      softModeEnabled: true,
    })
    expect(await settingsStore.verifyTeacherPin('0000')).toBe(true)

    await settingsStore.saveTrainingSettings({
      appTitle: '儿童听觉训练站',
      fullscreenEnabled: false,
      guidedOptionCount: 4,
      softModeEnabled: false,
    })

    expect(await settingsStore.loadTrainingSettings()).toEqual({
      appTitle: '儿童听觉训练站',
      fullscreenEnabled: false,
      guidedOptionCount: 4,
      softModeEnabled: false,
    })
  })

  it('migrates a legacy guided option count of 2 to 4 only once', async () => {
    const db = await createAppDatabase()
    await ensureBuiltinAssetsSeeded({ db })

    db.run(
      `
        update settings
        set
          guided_option_count = 2,
          guided_option_count_migrated_to_four = 0
        where id = 1
      `,
    )

    await ensureBuiltinAssetsSeeded({ db })

    const firstStore = createSettingsStore({
      database: db,
      saveSnapshot: vi.fn().mockResolvedValue(undefined),
    })

    expect(await firstStore.loadTrainingSettings()).toEqual({
      appTitle: '特殊儿童声音感知训练',
      fullscreenEnabled: true,
      guidedOptionCount: 4,
      softModeEnabled: true,
    })

    await firstStore.saveTrainingSettings({
      appTitle: '特殊儿童声音感知训练',
      fullscreenEnabled: true,
      guidedOptionCount: 2,
      softModeEnabled: true,
    })

    const secondStore = createSettingsStore({
      database: db,
      saveSnapshot: vi.fn().mockResolvedValue(undefined),
    })

    expect(await secondStore.loadTrainingSettings()).toEqual({
      appTitle: '特殊儿童声音感知训练',
      fullscreenEnabled: true,
      guidedOptionCount: 2,
      softModeEnabled: true,
    })
  })
})
