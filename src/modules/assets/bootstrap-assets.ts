import type { Database } from 'sql.js'
import builtinAssets from '../../assets/manifest/builtin-assets.json'
import { createAppDatabase } from '../../db/db-client'
import {
  ensureDefaultSettings,
  migrateLegacyGuidedOptionCountSetting,
  syncBuiltinAssets,
  markFirstRunCompleted,
  type BuiltinAssetDefinition,
} from './asset-repository'

type EnsureBuiltinAssetsSeededOptions = {
  db?: Database
}

type EnsureBuiltinAssetsSeededResult = {
  db: Database
  seededCount: number
}

export async function ensureBuiltinAssetsSeeded(
  options: EnsureBuiltinAssetsSeededOptions = {},
): Promise<EnsureBuiltinAssetsSeededResult> {
  const db = options.db ?? (await createAppDatabase())

  ensureDefaultSettings(db)
  migrateLegacyGuidedOptionCountSetting(db)

  const seededCount = syncBuiltinAssets(
    db,
    builtinAssets as BuiltinAssetDefinition[],
  )

  if (seededCount > 0) {
    markFirstRunCompleted(db)
  }

  return {
    db,
    seededCount,
  }
}
