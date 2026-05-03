import type { Database, QueryValue } from 'sql.js'
import { DEFAULT_APP_TITLE } from '../../config/app-settings'

export type AssetCategory =
  | 'animals'
  | 'nature'
  | 'transport'
  | 'instruments'
  | 'daily_life'

export type BuiltinAssetDefinition = {
  audio: string
  audioReady?: boolean
  category: AssetCategory
  id: string
  image: string
  title: string
}

function readCountValue(db: Database, sql: string): number {
  const value = db.exec(sql)[0]?.values[0]?.[0]

  if (typeof value === 'number') {
    return value
  }

  return Number(value ?? 0)
}

export function ensureDefaultSettings(db: Database) {
  const now = new Date().toISOString()

  db.run(
    `
      insert into settings (
        id,
        teacher_pin_hash,
        app_title,
        soft_mode_enabled,
        guided_option_count,
        guided_option_count_migrated_to_four,
        fullscreen_enabled,
        first_run_completed,
        created_at,
        updated_at
      )
      select 1, '0000', ?, 1, 4, 1, 1, 0, ?, ?
      where not exists (select 1 from settings where id = 1)
    `,
    [DEFAULT_APP_TITLE, now, now] satisfies QueryValue[],
  )
}

export function migrateLegacyGuidedOptionCountSetting(db: Database) {
  db.run(
    `
      update settings
      set
        guided_option_count = case
          when guided_option_count = 2 then 4
          else guided_option_count
        end,
        guided_option_count_migrated_to_four = 1,
        updated_at = ?
      where id = 1
        and guided_option_count_migrated_to_four = 0
    `,
    [new Date().toISOString()] satisfies QueryValue[],
  )
}

export function countBuiltinAssets(db: Database): number {
  return readCountValue(
    db,
    "select count(*) from assets where source_type = 'builtin'",
  )
}

export function readEnabledAssets(db: Database): BuiltinAssetDefinition[] {
  const rows =
    db.exec(
      `
        select
          id,
          category,
          title,
          image_path,
          audio_path
        from assets
        where enabled = 1
        order by sort_order asc, created_at asc, id asc
      `,
    )[0]?.values ?? []

  return rows.map((row) => ({
    audio: String(row[4]),
    category: String(row[1]) as AssetCategory,
    id: String(row[0]),
    image: String(row[3]),
    title: String(row[2]),
  }))
}

export function insertBuiltinAssets(
  db: Database,
  assets: BuiltinAssetDefinition[],
): number {
  const now = new Date().toISOString()

  assets.forEach((asset, index) => {
    db.run(
      `
        insert into assets (
          id,
          category,
          title,
          image_path,
          audio_path,
          source_type,
          enabled,
          sort_order,
          created_at,
          updated_at
        )
        values (?, ?, ?, ?, ?, 'builtin', 1, ?, ?, ?)
      `,
      [
        asset.id,
        asset.category,
        asset.title,
        asset.image,
        asset.audio,
        index + 1,
        now,
        now,
      ] satisfies QueryValue[],
    )
  })

  return assets.length
}

export function syncBuiltinAssets(
  db: Database,
  assets: BuiltinAssetDefinition[],
): number {
  const now = new Date().toISOString()
  const existingIds = new Set(
    (db.exec("select id from assets where source_type = 'builtin'")[0]?.values ?? []).map(
      (row) => String(row[0]),
    ),
  )
  let insertedCount = 0

  assets.forEach((asset, index) => {
    if (existingIds.has(asset.id)) {
      db.run(
        `
          update assets
          set
            category = ?,
            title = ?,
            image_path = ?,
            audio_path = ?,
            enabled = 1,
            sort_order = ?,
            updated_at = ?
          where id = ?
            and source_type = 'builtin'
        `,
        [
          asset.category,
          asset.title,
          asset.image,
          asset.audio,
          index + 1,
          now,
          asset.id,
        ] satisfies QueryValue[],
      )

      return
    }

    db.run(
      `
        insert into assets (
          id,
          category,
          title,
          image_path,
          audio_path,
          source_type,
          enabled,
          sort_order,
          created_at,
          updated_at
        )
        values (?, ?, ?, ?, ?, 'builtin', 1, ?, ?, ?)
      `,
      [
        asset.id,
        asset.category,
        asset.title,
        asset.image,
        asset.audio,
        index + 1,
        now,
        now,
      ] satisfies QueryValue[],
    )

    insertedCount += 1
  })

  return insertedCount
}

export function markFirstRunCompleted(db: Database) {
  db.run('update settings set first_run_completed = 1, updated_at = ? where id = 1', [
    new Date().toISOString(),
  ] satisfies QueryValue[])
}
