import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AdminSettingsStore } from './settings-store'
import AdminEntry from './admin-entry'

function createSettingsStoreMock(
  isValidPin = true,
): AdminSettingsStore {
  return {
    loadTrainingSettings: vi.fn().mockResolvedValue({
      appTitle: '特殊儿童声音感知训练',
      fullscreenEnabled: true,
      guidedOptionCount: 2,
      softModeEnabled: true,
    }),
    saveTrainingSettings: vi.fn().mockResolvedValue(undefined),
    verifyTeacherPin: vi.fn().mockResolvedValue(isValidPin),
  }
}

describe('AdminEntry', () => {
  it('opens the pin dialog after five hidden hotspot taps and unlocks admin access', async () => {
    const user = userEvent.setup()
    const onUnlocked = vi.fn()
    const settingsStore = createSettingsStoreMock()

    render(
      <AdminEntry onUnlocked={onUnlocked} settingsStore={settingsStore} />,
    )

    const hotspot = screen.getByRole('button', { name: '教师入口' })

    for (let tap = 0; tap < 5; tap += 1) {
      await user.click(hotspot)
    }

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.type(screen.getByLabelText('教师口令'), '0000')
    await user.click(screen.getByRole('button', { name: '进入教师台' }))

    await waitFor(() => {
      expect(settingsStore.verifyTeacherPin).toHaveBeenCalledWith('0000')
    })
    expect(onUnlocked).toHaveBeenCalledTimes(1)
  })
})
