import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SettingsScreen from './settings-screen'
import type { AdminSettingsStore } from './settings-store'

function createSettingsStoreMock(): AdminSettingsStore {
  return {
    loadTrainingSettings: vi.fn().mockResolvedValue({
      appTitle: '特殊儿童声音感知训练',
      fullscreenEnabled: true,
      guidedOptionCount: 2,
      softModeEnabled: true,
    }),
    saveTrainingSettings: vi.fn().mockResolvedValue(undefined),
    verifyTeacherPin: vi.fn().mockResolvedValue(true),
  }
}

describe('SettingsScreen', () => {
  it('does not render the old teacher console intro copy', async () => {
    render(<SettingsScreen settingsStore={createSettingsStoreMock()} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '保存设置' })).toBeEnabled()
    })

    expect(
      screen
        .getByRole('button', { name: '返回主页' })
        .querySelector('[data-testid=\"action-icon-back-home\"]'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText(
        '当前先开放柔和模式、引导候选项数量和默认全屏设置，保证训练体验可快速调整。',
      ),
    ).not.toBeInTheDocument()
  })

  it('saves the custom app title through the teacher settings form', async () => {
    const user = userEvent.setup()
    const settingsStore = createSettingsStoreMock()

    render(<SettingsScreen settingsStore={settingsStore} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '保存设置' })).toBeEnabled()
    })

    const appTitleInput = screen.getByLabelText('软件应用标题')

    await user.clear(appTitleInput)
    await user.type(appTitleInput, '儿童听觉训练站')
    await user.click(screen.getByRole('button', { name: '保存设置' }))

    await waitFor(() => {
      expect(settingsStore.saveTrainingSettings).toHaveBeenCalledWith({
        appTitle: '儿童听觉训练站',
        fullscreenEnabled: true,
        guidedOptionCount: 2,
        softModeEnabled: true,
      })
    })
  })
})
