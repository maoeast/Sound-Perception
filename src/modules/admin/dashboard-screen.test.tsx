import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import DashboardScreen from './dashboard-screen'

describe('DashboardScreen', () => {
  it('renders training summary cards', () => {
    render(<DashboardScreen />)

    expect(screen.getByText('总训练时长')).toBeInTheDocument()
    expect(screen.getByText('引导训练正确率')).toBeInTheDocument()
  })

  it('renders category accuracy labels in Chinese', async () => {
    render(
      <DashboardScreen
        summaryLoader={async () => ({
          categoryAccuracy: [
            { accuracy: 91, category: 'animals' },
            { accuracy: 90, category: 'daily_life' },
          ],
          explorePlayCount: 124,
          guidedAccuracy: 85,
          totalDurationMs: 22 * 60000,
          totalSessions: 38,
        })}
      />,
    )

    expect(await screen.findByText('动物')).toBeInTheDocument()
    expect(screen.getByText('日常生活')).toBeInTheDocument()
    expect(screen.queryByText('animals')).not.toBeInTheDocument()
    expect(screen.queryByText('daily_life')).not.toBeInTheDocument()
  })
})
