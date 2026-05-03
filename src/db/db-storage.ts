import { BaseDirectory } from '@tauri-apps/api/path'
import { exists, mkdir, readFile, writeFile } from '@tauri-apps/plugin-fs'

const DATABASE_DIRECTORY = 'database'
const DATABASE_FILE = `${DATABASE_DIRECTORY}/app.db`

export async function loadDatabaseBinary(): Promise<Uint8Array | null> {
  const hasSnapshot = await exists(DATABASE_FILE, {
    baseDir: BaseDirectory.AppLocalData,
  })

  if (!hasSnapshot) {
    return null
  }

  return readFile(DATABASE_FILE, {
    baseDir: BaseDirectory.AppLocalData,
  })
}

export async function saveDatabaseBinary(binary: Uint8Array): Promise<void> {
  await mkdir(DATABASE_DIRECTORY, {
    baseDir: BaseDirectory.AppLocalData,
    recursive: true,
  })

  await writeFile(DATABASE_FILE, binary, {
    baseDir: BaseDirectory.AppLocalData,
  })
}
