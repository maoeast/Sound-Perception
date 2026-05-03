// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createAppDatabase } from '../../db/db-client'
import builtinAssets from '../../assets/manifest/builtin-assets.json'
import {
  ensureDefaultSettings,
  insertBuiltinAssets,
  type BuiltinAssetDefinition,
} from './asset-repository'
import { ensureBuiltinAssetsSeeded } from './bootstrap-assets'

describe('ensureBuiltinAssetsSeeded', () => {
  it('seeds builtin assets on first run', async () => {
    const result = await ensureBuiltinAssetsSeeded()

    expect(result.seededCount).toBe(44)
  })

  it('does not seed builtin assets twice into the same database', async () => {
    const db = await createAppDatabase()

    const firstRun = await ensureBuiltinAssetsSeeded({ db })
    const secondRun = await ensureBuiltinAssetsSeeded({ db })

    expect(firstRun.seededCount).toBe(44)
    expect(secondRun.seededCount).toBe(0)
  })

  it('backfills missing builtin assets into an existing database', async () => {
    const db = await createAppDatabase()
    const firstFiveAssets = (builtinAssets as BuiltinAssetDefinition[]).slice(0, 5)

    ensureDefaultSettings(db)
    insertBuiltinAssets(db, firstFiveAssets)

    const result = await ensureBuiltinAssetsSeeded({ db })

    expect(result.seededCount).toBe(39)
    expect(
      db.exec("select count(*) from assets where source_type = 'builtin'")[0]?.values[0]?.[0],
    ).toBe(44)
  })
})
