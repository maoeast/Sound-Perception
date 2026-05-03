import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type {
  StartedTrainingSession,
  StatsRepository,
} from '../stats/stats-repository'
import ExploreScreen from './explore-screen'

function createStatsRepositoryMock(): StatsRepository {
  const session: StartedTrainingSession = {
    category: null,
    id: 'session-explore-01',
    mode: 'explore',
    startedAt: '2026-05-02T10:00:00.000Z',
  }

  return {
    completeSession: vi.fn().mockResolvedValue(undefined),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    recordInteractionEvent: vi.fn().mockResolvedValue(undefined),
    startSession: vi.fn().mockResolvedValue(session),
  }
}

describe('ExploreScreen', () => {
  it('renders builtin assets for the active category only', async () => {
    const user = userEvent.setup()

    render(
      <ExploreScreen
        audioEngine={{ playAsset: vi.fn() }}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    expect(
      screen.getByRole('heading', { name: '自由探索模式', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '小猫' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '小猫插图' })).toHaveAttribute(
      'src',
      '/builtin/animals/cat.png',
    )
    expect(screen.getByRole('button', { name: '小狗' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '小狗插图' })).toHaveAttribute(
      'src',
      '/builtin/animals/dog.png',
    )
    expect(screen.getByRole('button', { name: '企鹅' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '企鹅插图' })).toHaveAttribute(
      'src',
      '/builtin/animals/penguin.png',
    )
    expect(
      screen.queryByText(
        '标记“待补音频”的新卡片目前只展示图片，不播放声音，也不会进入引导训练。',
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        '一次只展示一个类别的大卡片，点击后立刻给出声音与温和的视觉反馈，帮助孩子建立图片和声音的对应关系。',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('explore-status-panel')).toBeInTheDocument()
    expect(screen.getByTestId('explore-grid')).toHaveAttribute(
      'data-layout',
      'touch-grid',
    )
    expect(
      screen.queryByRole('button', { name: '公交车' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '交通' }))

    expect(screen.getByRole('button', { name: '公交车' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '公交车插图' })).toHaveAttribute(
      'src',
      '/builtin/transport/bus.png',
    )
    expect(screen.getByRole('button', { name: '汽车' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '拖拉机' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '拖拉机插图' })).toHaveAttribute(
      'src',
      '/builtin/transport/tractor.png',
    )
    expect(screen.getByRole('button', { name: '消防车' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '消防车插图' })).toHaveAttribute(
      'src',
      '/builtin/transport/fire-truck.png',
    )
    expect(screen.queryByRole('button', { name: '小猫' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '日常生活' }))

    expect(screen.getByRole('button', { name: '切菜' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '切菜插图' })).toHaveAttribute(
      'src',
      '/builtin/daily-life/chopping-food.png',
    )
    expect(screen.getByRole('button', { name: '智能手机' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '智能手机插图' })).toHaveAttribute(
      'src',
      '/builtin/daily-life/iphone.png',
    )
    expect(screen.getByRole('button', { name: '高铁站' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '高铁站插图' })).toHaveAttribute(
      'src',
      '/builtin/daily-life/high-speed-rail-station.png',
    )
    expect(screen.getByRole('button', { name: '学校操场' })).toBeEnabled()
    expect(screen.getByRole('img', { name: '学校操场插图' })).toHaveAttribute(
      'src',
      '/builtin/daily-life/school-playground.png',
    )
  })

  it('plays a selected asset and shows the current playback state', async () => {
    const user = userEvent.setup()
    const playAsset = vi.fn().mockResolvedValue(undefined)
    const statsRepository = createStatsRepositoryMock()

    render(
      <ExploreScreen
        audioEngine={{ playAsset }}
        statsRepository={statsRepository}
      />,
    )

    await waitFor(() => {
      expect(statsRepository.startSession).toHaveBeenCalledWith({
        mode: 'explore',
      })
    })

    await user.click(screen.getByRole('button', { name: '小猫' }))

    expect(playAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        audioPath: 'builtin/animals/cat.wav',
        id: 'animal-cat-01',
        title: '小猫',
      }),
    )
    expect(statsRepository.recordInteractionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'animal-cat-01',
        eventType: 'play',
        sessionId: 'session-explore-01',
      }),
    )
    expect(screen.getByText('正在播放：小猫')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '小猫' })).toHaveAttribute(
      'data-playing',
      'true',
    )
  })

  it('simplifies explore cards to a centered title without category or play hints', () => {
    render(
      <ExploreScreen
        audioEngine={{ playAsset: vi.fn() }}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    const card = screen.getByRole('button', { name: '小猫' })
    const meta = card.querySelector('.explore-card__meta')

    expect(meta).toHaveClass('explore-card__meta--simple')
    expect(meta?.childElementCount).toBe(1)
    expect(within(card).getByText('小猫')).toBeInTheDocument()
    expect(within(card).queryByText('动物')).not.toBeInTheDocument()
    expect(within(card).queryByText('点击播放声音')).not.toBeInTheDocument()
    expect(within(card).queryByText('再次播放声音')).not.toBeInTheDocument()
  })

  it('does not show preview-only hints when all builtin assets have audio', () => {
    render(
      <ExploreScreen
        audioEngine={{ playAsset: vi.fn() }}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    expect(
      screen.queryByText('图片预览，音频待补充'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        '标记“待补音频”的新卡片目前只展示图片，不播放声音，也不会进入引导训练。',
      ),
    ).not.toBeInTheDocument()
  })

  it('plays newly formalized builtin assets without treating them as preview-only', async () => {
    const user = userEvent.setup()
    const playAsset = vi.fn().mockResolvedValue(undefined)

    render(
      <ExploreScreen
        audioEngine={{ playAsset }}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '小狗' }))

    expect(playAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        audioPath: 'builtin/animals/dog.wav',
        id: 'animal-dog-01',
        title: '小狗',
      }),
    )
  })

  it('calls the back handler when returning home', async () => {
    const user = userEvent.setup()
    const onBackHome = vi.fn()

    render(
      <ExploreScreen
        audioEngine={{ playAsset: vi.fn() }}
        onBackHome={onBackHome}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    expect(
      within(screen.getByRole('button', { name: '返回主页' })).getByTestId(
        'action-icon-back-home',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '返回主页' }))

    expect(onBackHome).toHaveBeenCalledTimes(1)
  })
})
