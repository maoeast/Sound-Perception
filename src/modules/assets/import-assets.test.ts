import { describe, expect, it, vi, afterEach } from 'vitest'
import { createAppDatabase } from '../../db/db-client'
import { readEnabledAssets } from './asset-repository'

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (value: string) => value,
  isTauri: () => false,
}))

import { importCustomAsset } from './import-assets'

function createMockFileList(file: File | null) {
  if (!file) {
    return {
      item: () => null,
      length: 0,
    }
  }

  return {
    0: file,
    item: (index: number) => (index === 0 ? file : null),
    length: 1,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('importCustomAsset', () => {
  it('imports a custom asset in browser preview into the provided database', async () => {
    const db = await createAppDatabase()
    const imageFile = new File(['preview-image'], 'goose.png', {
      type: 'image/png',
    })
    const audioFile = new File(['preview-audio'], 'goose.wav', {
      type: 'audio/wav',
    })
    const selectedFiles = [imageFile, audioFile]

    vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function clickMock(this: HTMLInputElement) {
        const file = selectedFiles.shift() ?? null

        Object.defineProperty(this, 'files', {
          configurable: true,
          value: createMockFileList(file),
        })

        this.dispatchEvent(new Event('change'))
      })

    const importedAsset = await importCustomAsset({
      category: 'animals',
      database: db,
      title: '大鹅',
    })

    expect(importedAsset).toMatchObject({
      category: 'animals',
      previewOnly: true,
      title: '大鹅',
    })

    const assets = readEnabledAssets(db)
    const storedAsset = assets.find((asset) => asset.id === importedAsset?.id)

    expect(storedAsset).toMatchObject({
      category: 'animals',
      title: '大鹅',
    })
    expect(storedAsset?.image.startsWith('data:image/png')).toBe(true)
    expect(storedAsset?.audio.startsWith('data:audio/wav')).toBe(true)
  })
})
