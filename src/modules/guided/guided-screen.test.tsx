import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PlayableAsset } from '../../audio/audio-engine'
import type {
  GuidedAsset,
  GuidedStatsRepository,
  StartedTrainingSession,
} from './use-guided-session'
import GuidedScreen from './guided-screen'

const TEST_ASSETS: GuidedAsset[] = [
  {
    audio: 'builtin/animals/cat.wav',
    category: 'animals',
    id: 'animal-cat-01',
    image: 'builtin/animals/cat.png',
    title: '小猫',
  },
  {
    audio: 'builtin/nature/rain.wav',
    category: 'nature',
    id: 'nature-rain-01',
    image: 'builtin/nature/rain.png',
    title: '下雨',
  },
  {
    audio: 'builtin/transport/bus.wav',
    category: 'transport',
    id: 'transport-bus-01',
    image: 'builtin/transport/bus.png',
    title: '公交车',
  },
  {
    audio: 'builtin/instruments/piano.wav',
    category: 'instruments',
    id: 'instrument-piano-01',
    image: 'builtin/instruments/piano.png',
    title: '钢琴',
  },
]

function createStatsRepositoryMock(): GuidedStatsRepository {
  const session: StartedTrainingSession = {
    category: null,
    id: 'session-guided-01',
    mode: 'guided',
    startedAt: '2026-05-02T09:00:00.000Z',
  }

  return {
    completeSession: vi.fn().mockResolvedValue(undefined),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
    recordInteractionEvent: vi.fn().mockResolvedValue(undefined),
    startSession: vi.fn().mockResolvedValue(session),
  }
}

function createDeferredPromise() {
  let resolve!: () => void
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

describe('GuidedScreen', () => {
  it('plays success feedback and automatically advances after a correct answer', async () => {
    const user = userEvent.setup()
    const audioEngine = {
      playAsset: vi.fn<(_asset: PlayableAsset) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }
    const feedbackAudioPlayer = {
      play: vi.fn<(_audioPath: string) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }
    const statsRepository = createStatsRepositoryMock()

    render(
      <GuidedScreen
        assets={TEST_ASSETS}
        audioEngine={audioEngine}
        feedbackAudioPlayer={feedbackAudioPlayer}
        optionCount={4}
        random={() => 0}
        statsRepository={statsRepository}
      />,
    )

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          audioPath: 'builtin/animals/cat.wav',
          id: 'animal-cat-01',
          title: '小猫',
        }),
      )
    })
    expect(screen.getByRole('img', { name: '小猫插图' })).toHaveAttribute(
      'src',
      '/builtin/animals/cat.png',
    )
    expect(
      within(screen.getByRole('button', { name: '返回主页' })).getByTestId(
        'action-icon-back-home',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        '当前引导训练只包含已配套音频的素材；待补音频的新图片暂不进入训练题目。',
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        '先播放目标声音，再从少量候选卡片中做匹配。答对给出清晰正反馈，答错只保留温和提示。',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('guided-grid')).toHaveAttribute(
      'data-option-count',
      '4',
    )

    await user.click(screen.getByRole('button', { name: '小猫' }))

    expect(feedbackAudioPlayer.play).toHaveBeenCalledWith(
      'ui-feedback/correct-answer.wav',
    )
    expect(statsRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateAssetIds: expect.arrayContaining([
          'animal-cat-01',
          'nature-rain-01',
          'transport-bus-01',
          'instrument-piano-01',
        ]),
        isCorrect: true,
        selectedAssetId: 'animal-cat-01',
        sessionId: 'session-guided-01',
        targetAssetId: 'animal-cat-01',
      }),
    )
    expect(statsRepository.recordInteractionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'animal-cat-01',
        eventType: 'complete',
        sessionId: 'session-guided-01',
      }),
    )

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledTimes(2)
    })
    expect(screen.queryByRole('button', { name: '下一题' })).not.toBeInTheDocument()
    expect(screen.getByText('听一听，再点击对应的卡片')).toBeInTheDocument()
  })

  it('plays error feedback and shakes the selected card after a wrong answer', async () => {
    const user = userEvent.setup()
    const audioEngine = {
      playAsset: vi.fn<(_asset: PlayableAsset) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }
    const feedbackAudioPlayer = {
      play: vi.fn<(_audioPath: string) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }
    const statsRepository = createStatsRepositoryMock()

    render(
      <GuidedScreen
        assets={TEST_ASSETS}
        audioEngine={audioEngine}
        feedbackAudioPlayer={feedbackAudioPlayer}
        optionCount={4}
        random={() => 0}
        statsRepository={statsRepository}
      />,
    )

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: '下雨' }))

    expect(feedbackAudioPlayer.play).toHaveBeenCalledWith(
      'ui-feedback/wrong-answer.wav',
    )
    expect(screen.getByText('请再试一次')).toBeInTheDocument()
    expect(statsRepository.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: false,
        selectedAssetId: 'nature-rain-01',
        targetAssetId: 'animal-cat-01',
      }),
    )
    expect(screen.getByRole('button', { name: '下雨' })).toHaveClass(
      'guided-choice--incorrect-animated',
    )

    await user.click(screen.getByRole('button', { name: '重新播放声音' }))

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledTimes(2)
    })
    expect(statsRepository.recordInteractionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'animal-cat-01',
        eventType: 'replay',
        sessionId: 'session-guided-01',
      }),
    )
  })

  it('filters out preview-only assets before generating guided questions', async () => {
    const audioEngine = {
      playAsset: vi.fn<(_asset: PlayableAsset) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }

    render(
      <GuidedScreen
        assets={[
          TEST_ASSETS[0],
          {
            audio: 'builtin/animals/dog.wav',
            audioReady: false,
            category: 'animals',
            id: 'animal-dog-01',
            image: 'builtin/animals/dog.png',
            title: '小狗',
          },
        ]}
        audioEngine={audioEngine}
        optionCount={2}
        random={() => 0}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          audioPath: 'builtin/animals/cat.wav',
          id: 'animal-cat-01',
          title: '小猫',
        }),
      )
    })

    expect(
      screen.queryByRole('button', { name: '小狗' }),
    ).not.toBeInTheDocument()
  })

  it('cycles through each target once before starting a new guided round', async () => {
    const user = userEvent.setup()
    const audioEngine = {
      playAsset: vi.fn<(_asset: PlayableAsset) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }

    render(
      <GuidedScreen
        assets={TEST_ASSETS}
        audioEngine={audioEngine}
        feedbackAudioPlayer={{
          play: vi.fn<(_audioPath: string) => Promise<void>>().mockResolvedValue(
            undefined,
          ),
        }}
        optionCount={4}
        random={() => 0}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    const expectedTargetOrder = ['小猫', '下雨', '公交车', '钢琴', '小猫']

    for (const [index, title] of expectedTargetOrder.entries()) {
      await waitFor(() => {
        expect(audioEngine.playAsset).toHaveBeenNthCalledWith(
          index + 1,
          expect.objectContaining({
            title,
          }),
        )
      })

      if (index < expectedTargetOrder.length - 1) {
        await user.click(screen.getByRole('button', { name: title }))
      }
    }
  })

  it('simplifies guided choices to a centered title without category labels', async () => {
    render(
      <GuidedScreen
        assets={TEST_ASSETS}
        audioEngine={{
          playAsset: vi.fn<(_asset: PlayableAsset) => Promise<void>>().mockResolvedValue(
            undefined,
          ),
        }}
        optionCount={2}
        random={() => 0}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    const card = await screen.findByRole('button', { name: '小猫' })
    const meta = card.querySelector('.guided-choice__meta')

    expect(meta).toHaveClass('guided-choice__meta--simple')
    expect(meta?.childElementCount).toBe(1)
    expect(within(card).getByText('小猫')).toBeInTheDocument()
    expect(within(card).queryByText('动物')).not.toBeInTheDocument()
  })

  it('starts feedback audio before stats persistence settles', async () => {
    const user = userEvent.setup()
    const audioEngine = {
      playAsset: vi.fn<(_asset: PlayableAsset) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }
    const feedbackAudioPlayer = {
      play: vi.fn<(_audioPath: string) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }
    const recordAttemptDeferred = createDeferredPromise()
    const statsRepository = createStatsRepositoryMock()
    statsRepository.recordAttempt = vi.fn().mockImplementation(
      () => recordAttemptDeferred.promise,
    )

    render(
      <GuidedScreen
        assets={TEST_ASSETS}
        audioEngine={audioEngine}
        feedbackAudioPlayer={feedbackAudioPlayer}
        optionCount={4}
        random={() => 0}
        statsRepository={statsRepository}
      />,
    )

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: '小猫' }))

    expect(feedbackAudioPlayer.play).toHaveBeenCalledWith(
      'ui-feedback/correct-answer.wav',
    )

    recordAttemptDeferred.resolve()
  })

  it('uses the shared audio engine for feedback sounds by default', async () => {
    const user = userEvent.setup()
    const audioEngine = {
      playAsset: vi.fn<(_asset: PlayableAsset) => Promise<void>>().mockResolvedValue(
        undefined,
      ),
    }

    render(
      <GuidedScreen
        assets={TEST_ASSETS}
        audioEngine={audioEngine}
        optionCount={4}
        random={() => 0}
        statsRepository={createStatsRepositoryMock()}
      />,
    )

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          audioPath: 'builtin/animals/cat.wav',
          id: 'animal-cat-01',
          title: '小猫',
        }),
      )
    })

    await user.click(screen.getByRole('button', { name: '小猫' }))

    await waitFor(() => {
      expect(audioEngine.playAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          audioPath: 'ui-feedback/correct-answer.wav',
          id: 'guided-feedback-correct',
          title: '回答正确提示音',
        }),
      )
    })
  })
})
