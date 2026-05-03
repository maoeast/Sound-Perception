import { convertFileSrc, isTauri } from '@tauri-apps/api/core'
import { appLocalDataDir, join } from '@tauri-apps/api/path'
import type { Database, QueryValue } from 'sql.js'
import type { AssetCategory } from './asset-repository'
import { createAppDatabase, exportDatabaseBinary } from '../../db/db-client'
import { ensureBuiltinAssetsSeeded } from './bootstrap-assets'

export type ImportCustomAssetInput = {
  category: AssetCategory
  database?: Database
  title: string
}

export type ImportedCustomAsset = {
  audioPath: string
  category: AssetCategory
  id: string
  imagePath: string
  previewOnly?: boolean
  title: string
}

type PersistImportedAssetInput = {
  audioPath: string
  category: AssetCategory
  database?: Database
  id?: string
  imagePath: string
  previewOnly?: boolean
  title: string
}

function createAssetId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `custom-${crypto.randomUUID()}`
  }

  return `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getFileExtension(path: string) {
  const safePath = path.split(/[?#]/)[0]
  const extensionIndex = safePath.lastIndexOf('.')

  return extensionIndex === -1 ? '' : safePath.slice(extensionIndex)
}

function createInputElement(accept: string) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = false
  input.style.position = 'fixed'
  input.style.left = '-9999px'
  input.style.top = '-9999px'
  return input
}

async function pickBrowserFile(accept: string): Promise<File | null> {
  if (typeof document === 'undefined') {
    return null
  }

  return new Promise((resolve) => {
    const input = createInputElement(accept)
    let settled = false

    function cleanup() {
      input.removeEventListener('change', handleChange)
      input.remove()
    }

    function settle(file: File | null) {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      resolve(file)
    }

    function handleChange() {
      settle(input.files?.[0] ?? null)
    }

    input.addEventListener('change', handleChange)
    document.body.appendChild(input)
    input.click()

    window.setTimeout(() => {
      window.addEventListener(
        'focus',
        () => {
          window.setTimeout(() => {
            settle(input.files?.[0] ?? null)
          }, 250)
        },
        { once: true },
      )
    }, 0)
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Unable to read file as data URL'))
    }

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file'))
    }

    reader.readAsDataURL(file)
  })
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

function readNextSortOrder(db: Awaited<ReturnType<typeof createAppDatabase>>) {
  const currentMax = db.exec('select coalesce(max(sort_order), 0) from assets')[0]
    ?.values[0]?.[0]

  return Number(currentMax ?? 0) + 1
}

async function persistImportedAsset({
  audioPath,
  category,
  database,
  id = createAssetId(),
  imagePath,
  previewOnly = false,
  title,
}: PersistImportedAssetInput): Promise<ImportedCustomAsset> {
  const db = database ?? (await createAppDatabase((await safelyLoadSnapshot()) ?? undefined))

  await ensureBuiltinAssetsSeeded({ db })

  const now = new Date().toISOString()

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
      values (?, ?, ?, ?, ?, 'custom', 1, ?, ?, ?)
    `,
    [
      id,
      category,
      title,
      imagePath,
      audioPath,
      readNextSortOrder(db),
      now,
      now,
    ] satisfies QueryValue[],
  )

  await safelySaveSnapshot(exportDatabaseBinary(db))

  return {
    audioPath,
    category,
    id,
    imagePath,
    previewOnly,
    title,
  }
}

export async function importCustomAsset({
  category,
  database,
  title,
}: ImportCustomAssetInput): Promise<ImportedCustomAsset | null> {
  try {
    if (!isTauri()) {
      const imageFile = await pickBrowserFile('.png,.jpg,.jpeg,.webp')

      if (!imageFile) {
        return null
      }

      const audioFile = await pickBrowserFile('.wav,.mp3,.ogg,.m4a')

      if (!audioFile) {
        return null
      }

      const [imagePath, audioPath] = await Promise.all([
        readFileAsDataUrl(imageFile),
        readFileAsDataUrl(audioFile),
      ])

      return persistImportedAsset({
        audioPath,
        category,
        database,
        imagePath,
        previewOnly: true,
        title,
      })
    }

    const [{ open }, { BaseDirectory, copyFile, mkdir }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ])

    const imageSelection = await open({
      filters: [
        {
          extensions: ['png', 'jpg', 'jpeg', 'webp'],
          name: 'Image',
        },
      ],
      multiple: false,
    })

    if (!imageSelection || Array.isArray(imageSelection)) {
      return null
    }

    const audioSelection = await open({
      filters: [
        {
          extensions: ['wav', 'mp3', 'ogg', 'm4a'],
          name: 'Audio',
        },
      ],
      multiple: false,
    })

    if (!audioSelection || Array.isArray(audioSelection)) {
      return null
    }

    const assetId = createAssetId()
    const imageRelativePath = `custom/images/${assetId}${getFileExtension(imageSelection) || '.png'}`
    const audioRelativePath = `custom/audio/${assetId}${getFileExtension(audioSelection) || '.wav'}`

    await mkdir('assets/custom/images', {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    })
    await mkdir('assets/custom/audio', {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    })
    await copyFile(imageSelection, `assets/${imageRelativePath}`, {
      toPathBaseDir: BaseDirectory.AppLocalData,
    })
    await copyFile(audioSelection, `assets/${audioRelativePath}`, {
      toPathBaseDir: BaseDirectory.AppLocalData,
    })

    const localDataPath = await appLocalDataDir()
    const [imageAbsolutePath, audioAbsolutePath] = await Promise.all([
      join(localDataPath, 'assets', imageRelativePath),
      join(localDataPath, 'assets', audioRelativePath),
    ])

    return persistImportedAsset({
      audioPath: convertFileSrc(audioAbsolutePath),
      category,
      database,
      id: assetId,
      imagePath: convertFileSrc(imageAbsolutePath),
      title,
    })
  } catch {
    return null
  }
}
