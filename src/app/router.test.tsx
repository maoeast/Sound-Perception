import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppDatabase } from '../db/db-client'
import { ensureBuiltinAssetsSeeded } from '../modules/assets/bootstrap-assets'

const tauriMocks = vi.hoisted(() => ({
  close: vi.fn(),
  isTauri: false,
  setTitle: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => tauriMocks.isTauri,
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    close: tauriMocks.close,
    setTitle: tauriMocks.setTitle,
  }),
}))

import AppRouter from './router'

async function renderRouterWithDatabase(
  seed?: (db: Awaited<ReturnType<typeof createAppDatabase>>) => void | Promise<void>,
) {
  const db = await createAppDatabase()
  await ensureBuiltinAssetsSeeded({ db })

  if (seed) {
    await seed(db)
  }

  render(
    <AppRouter database={db} />,
  )

  return db
}

describe('AppRouter', () => {
  beforeEach(() => {
    document.title = 'before-test'
    tauriMocks.isTauri = false
    tauriMocks.close.mockReset()
    tauriMocks.setTitle.mockReset()
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
  })

  it('navigates between the training screens and back', async () => {
    const user = userEvent.setup()

    await renderRouterWithDatabase()

    await user.click(screen.getByRole('button', { name: '自由探索' }))
    expect(
      screen.getByRole('heading', { name: '自由探索模式', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '小猫' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '返回主页' }))
    expect(screen.getByRole('button', { name: '引导训练' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '引导训练' }))
    expect(
      screen.getByRole('heading', { name: '引导训练模式', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新播放声音' })).toBeInTheDocument()
    expect(screen.getByTestId('guided-grid')).toHaveAttribute(
      'data-option-count',
      '4',
    )
  })

  it('opens the admin settings screen through the hidden teacher entry', async () => {
    const user = userEvent.setup()

    await renderRouterWithDatabase()

    const hotspot = screen.getAllByRole('button', { name: '教师入口' })[1]

    for (let tap = 0; tap < 5; tap += 1) {
      await user.click(hotspot)
    }

    await user.type(screen.getByLabelText('教师口令'), '0000')
    await user.click(screen.getByRole('button', { name: '进入教师台' }))

    expect(
      await screen.findByRole('heading', { name: '教师管理台', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存设置' })).toBeInTheDocument()
    expect(screen.getByText('总训练时长')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '导入图片和音频' }),
    ).toBeInTheDocument()
  })

  it('opens the admin settings screen through the visible home teacher entry', async () => {
    const user = userEvent.setup()

    await renderRouterWithDatabase()

    await user.click(screen.getAllByRole('button', { name: '教师入口' })[0])

    expect(
      await screen.findByRole('heading', { name: '教师管理台', level: 1 }),
    ).toBeInTheDocument()
  })

  it('shows a preview hint instead of closing the app in browser mode', async () => {
    const user = userEvent.setup()

    await renderRouterWithDatabase()

    await user.click(screen.getByRole('button', { name: '退出应用' }))

    expect(screen.getByText('预览模式不能退出应用')).toBeInTheDocument()
  })

  it('closes the current window when running inside the desktop shell', async () => {
    const user = userEvent.setup()

    tauriMocks.isTauri = true

    await renderRouterWithDatabase()

    await user.click(screen.getByRole('button', { name: '退出应用' }))

    await waitFor(() => {
      expect(tauriMocks.close).toHaveBeenCalledTimes(1)
    })
  })

  it('shows custom assets from the database in explore mode', async () => {
    const user = userEvent.setup()

    await renderRouterWithDatabase((db) => {
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
          'custom-goose-01',
          'animals',
          '大鹅',
          'data:image/png;base64,goose-image',
          'data:audio/wav;base64,goose-audio',
          999,
          '2026-05-02T10:00:00.000Z',
          '2026-05-02T10:00:00.000Z',
        ],
      )
    })

    await user.click(screen.getByRole('button', { name: '自由探索' }))

    expect(screen.getByRole('button', { name: '大鹅' })).toBeInTheDocument()
  })

  it('applies the saved guided option count in the guided training screen', async () => {
    const user = userEvent.setup()

    await renderRouterWithDatabase()

    await user.click(screen.getAllByRole('button', { name: '教师入口' })[0])

    expect(
      await screen.findByRole('heading', { name: '教师管理台', level: 1 }),
    ).toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText('引导训练候选项数量'),
      '4',
    )
    await user.click(screen.getByRole('button', { name: '保存设置' }))

    await waitFor(() => {
      expect(screen.getByText('设置已保存。')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '返回主页' }))
    await user.click(screen.getByRole('button', { name: '引导训练' }))

    expect(
      await screen.findByRole('heading', { name: '引导训练模式', level: 1 }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('guided-grid')).toHaveAttribute(
        'data-option-count',
        '4',
      )
    })
  })

  it('applies the saved app title to the home screen and shell titles', async () => {
    const user = userEvent.setup()
    tauriMocks.isTauri = true

    await renderRouterWithDatabase()

    await waitFor(() => {
      expect(document.title).toBe('特殊儿童声音感知训练')
    })

    await user.click(screen.getAllByRole('button', { name: '教师入口' })[0])

    expect(
      await screen.findByRole('heading', { name: '教师管理台', level: 1 }),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('软件应用标题'))
    await user.type(screen.getByLabelText('软件应用标题'), '儿童听觉训练站')
    await user.click(screen.getByRole('button', { name: '保存设置' }))

    await waitFor(() => {
      expect(screen.getByText('设置已保存。')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '返回主页' }))

    expect(
      await screen.findByRole('heading', { name: '儿童听觉训练站', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('请选择今天的训练方式')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(document.title).toBe('儿童听觉训练站')
      expect(tauriMocks.setTitle).toHaveBeenLastCalledWith('儿童听觉训练站')
    })
  })
})
