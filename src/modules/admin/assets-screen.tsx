import { useState } from 'react'
import type { Database } from 'sql.js'
import type { AssetCategory } from '../assets/asset-repository'
import {
  importCustomAsset,
  type ImportCustomAssetInput,
  type ImportedCustomAsset,
} from '../assets/import-assets'

type AssetsScreenProps = {
  database?: Database
  onImportAsset?: (
    input: ImportCustomAssetInput,
  ) => Promise<ImportedCustomAsset | null>
}

const CATEGORY_OPTIONS: Array<{ label: string; value: AssetCategory }> = [
  { label: '动物', value: 'animals' },
  { label: '自然', value: 'nature' },
  { label: '交通', value: 'transport' },
  { label: '乐器', value: 'instruments' },
  { label: '日常生活', value: 'daily_life' },
]

export default function AssetsScreen({
  database,
  onImportAsset,
}: AssetsScreenProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<AssetCategory>('animals')
  const [statusMessage, setStatusMessage] = useState(
    '填写素材标题后即可导入一张图片和一段音频。',
  )

  async function handleImport() {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setStatusMessage('请先填写素材标题。')
      return
    }

    setStatusMessage('正在导入素材...')

    const importAsset =
      onImportAsset ??
      ((input: ImportCustomAssetInput) =>
        importCustomAsset({ ...input, database }))

    const result = await importAsset({
      category,
      title: trimmedTitle,
    })

    if (!result) {
      setStatusMessage('导入已取消或失败。')
      return
    }

    setStatusMessage(
      result.previewOnly
        ? `已导入素材：${result.title}（预览模式下仅当前会话可用）`
        : `已导入素材：${result.title}`,
    )
    setTitle('')
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <h2>素材管理</h2>
        <p>从本地选择图片和音频，追加新的自定义训练素材。</p>
      </div>

      <div className="asset-form">
        <label className="settings-field">
          <span className="settings-field__label">素材标题</span>
          <input
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：消防车"
            type="text"
            value={title}
          />
        </label>

        <label className="settings-field">
          <span className="settings-field__label">素材类别</span>
          <select
            onChange={(event) => {
              setCategory(event.target.value as AssetCategory)
            }}
            value={category}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button className="primary-action" onClick={() => void handleImport()} type="button">
          导入图片和音频
        </button>
      </div>

      <p className="settings-status" role="status">
        {statusMessage}
      </p>
    </section>
  )
}
