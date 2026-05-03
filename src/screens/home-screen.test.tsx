import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import HomeScreen from './home-screen'

describe('HomeScreen', () => {
  it('renders the default app title and two training entry buttons', () => {
    render(<HomeScreen />)

    const title = screen.getByRole('heading', {
      name: '特殊儿童声音感知训练',
      level: 1,
    })
    const exploreButton = screen.getByRole('button', { name: '自由探索' })
    const guidedButton = screen.getByRole('button', { name: '引导训练' })

    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('hero-copy__title--cyan')
    expect(exploreButton).toBeInTheDocument()
    expect(guidedButton).toBeInTheDocument()
    expect(
      within(exploreButton).getByTestId('primary-tile-icon-explore'),
    ).toBeInTheDocument()
    expect(
      within(guidedButton).getByTestId('primary-tile-icon-guided'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('button', { name: '教师入口' })).getByTestId(
        'action-icon-teacher-entry',
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('button', { name: '教师入口' }))
        .getByTestId('action-icon-teacher-entry')
        .closest('.secondary-action__icon--playful'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('button', { name: '退出应用' })).getByTestId(
        'action-icon-exit-app',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('训练入口')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '教师入口' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '退出应用' })).toBeInTheDocument()
  })

  it('renders a custom app title and removes the old prompt copy', () => {
    render(<HomeScreen appTitle="儿童听觉训练站" />)

    expect(screen.getByTestId('home-hero')).toBeInTheDocument()
    expect(screen.getByTestId('home-action-grid')).toBeInTheDocument()
    expect(screen.getByTestId('home-panel')).toHaveClass(
      'screen-panel--home--illustrated',
      'screen-panel--home--illustrated-strong',
    )
    expect(
      screen.getByRole('heading', { name: '儿童听觉训练站', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('请选择今天的训练方式'),
    ).not.toBeInTheDocument()
  })

  it('calls the provided handlers when a mode is selected', async () => {
    const user = userEvent.setup()
    const onOpenExplore = vi.fn()
    const onOpenGuided = vi.fn()
    const onOpenAdmin = vi.fn()
    const onExitApp = vi.fn()

    render(
      <HomeScreen
        onExitApp={onExitApp}
        onOpenAdmin={onOpenAdmin}
        onOpenExplore={onOpenExplore}
        onOpenGuided={onOpenGuided}
      />,
    )

    await user.click(screen.getByRole('button', { name: '自由探索' }))
    await user.click(screen.getByRole('button', { name: '引导训练' }))
    await user.click(screen.getByRole('button', { name: '教师入口' }))
    await user.click(screen.getByRole('button', { name: '退出应用' }))

    expect(onOpenExplore).toHaveBeenCalledTimes(1)
    expect(onOpenGuided).toHaveBeenCalledTimes(1)
    expect(onOpenAdmin).toHaveBeenCalledTimes(1)
    expect(onExitApp).toHaveBeenCalledTimes(1)
  })
})
