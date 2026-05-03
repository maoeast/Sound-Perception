import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { DEFAULT_APP_TITLE } from '../config/app-settings'
import { SCHEMA_SQL } from './schema'

let sqlModulePromise: Promise<SqlJsStatic> | null = null

function resolveSqlWasmPath(file: string) {
  if (
    typeof navigator !== 'undefined' &&
    /jsdom/i.test(navigator.userAgent)
  ) {
    const nodeProcess = globalThis as typeof globalThis & {
      process?: {
        cwd?: () => string
      }
    }

    return `${nodeProcess.process?.cwd?.() ?? ''}/public/sql-wasm/${file}`
  }

  return `/sql-wasm/${file}`
}

function createSqlModule() {
  if (typeof window === 'undefined') {
    return initSqlJs()
  }

  return initSqlJs({
    locateFile: resolveSqlWasmPath,
  })
}

async function loadSqlModule() {
  if (!sqlModulePromise) {
    sqlModulePromise = createSqlModule().catch((error) => {
      sqlModulePromise = null
      throw error
    })
  }

  return sqlModulePromise
}

const DEFAULT_APP_TITLE_SQL = DEFAULT_APP_TITLE.replaceAll("'", "''")

function ensureSettingsAppTitleColumn(db: Database) {
  const columns =
    db.exec('pragma table_info(settings)')[0]?.values.map((row) => String(row[1])) ??
    []

  if (columns.includes('app_title')) {
    return
  }

  db.run(
    `alter table settings add column app_title text not null default '${DEFAULT_APP_TITLE_SQL}'`,
  )
}

function ensureGuidedOptionCountMigrationFlagColumn(db: Database) {
  const columns =
    db.exec('pragma table_info(settings)')[0]?.values.map((row) => String(row[1])) ??
    []

  if (columns.includes('guided_option_count_migrated_to_four')) {
    return
  }

  db.run(
    'alter table settings add column guided_option_count_migrated_to_four integer not null default 0',
  )
}

export async function createAppDatabase(binary?: Uint8Array): Promise<Database> {
  const SQL = await loadSqlModule()
  const db = binary ? new SQL.Database(binary) : new SQL.Database()

  db.exec(SCHEMA_SQL)
  ensureSettingsAppTitleColumn(db)
  ensureGuidedOptionCountMigrationFlagColumn(db)

  return db
}

export function exportDatabaseBinary(db: Database): Uint8Array {
  return db.export()
}
