// @vitest-environment node

import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'
import { createAppDatabase } from './db-client'

describe('createAppDatabase', () => {
  it('adds app_title to legacy settings tables', async () => {
    const SQL = await initSqlJs()
    const legacyDb = new SQL.Database()

    legacyDb.exec(`
      create table settings (
        id integer primary key,
        teacher_pin_hash text not null,
        soft_mode_enabled integer not null default 1,
        guided_option_count integer not null default 2,
        fullscreen_enabled integer not null default 1,
        first_run_completed integer not null default 0,
        created_at text not null,
        updated_at text not null
      );

      insert into settings (
        id,
        teacher_pin_hash,
        soft_mode_enabled,
        guided_option_count,
        fullscreen_enabled,
        first_run_completed,
        created_at,
        updated_at
      )
      values (1, '0000', 1, 2, 1, 0, '2026-05-03T00:00:00.000Z', '2026-05-03T00:00:00.000Z');
    `)

    const db = await createAppDatabase(legacyDb.export())
    const columns =
      db.exec('pragma table_info(settings)')[0]?.values.map((row) => String(row[1])) ??
      []

    expect(columns).toContain('app_title')
    expect(
      db.exec('select app_title from settings where id = 1')[0]?.values[0]?.[0],
    ).toBe('特殊儿童声音感知训练')
  })
})
