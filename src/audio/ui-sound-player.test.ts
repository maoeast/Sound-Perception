import { describe, expect, it, vi } from 'vitest'
import { UiSoundPlayer } from './ui-sound-player'

type MockAudioInstance = {
  currentTime: number
  onended: (() => void) | null
  onerror: (() => void) | null
  pause: ReturnType<typeof vi.fn>
  play: ReturnType<typeof vi.fn>
  preload: string
  src: string
}

describe('UiSoundPlayer', () => {
  it('stops the previous feedback sound before starting a new one', async () => {
    const createdAudios: MockAudioInstance[] = []

    const MockAudio = vi.fn(function MockAudio(this: unknown, src: string) {
      const audio: MockAudioInstance = {
        currentTime: 0,
        onended: null,
        onerror: null,
        pause: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        preload: '',
        src,
      }

      createdAudios.push(audio)
      return audio
    })

    vi.stubGlobal('Audio', MockAudio)

    const player = new UiSoundPlayer()
    const firstPlayPromise = player.play('ui-feedback/correct-answer.wav')

    expect(createdAudios).toHaveLength(1)

    const secondPlayPromise = player.play('ui-feedback/wrong-answer.wav')

    expect(createdAudios).toHaveLength(2)
    expect(createdAudios[0].pause).toHaveBeenCalledTimes(1)
    expect(createdAudios[0].currentTime).toBe(0)

    createdAudios[1].onended?.()

    await secondPlayPromise
    await firstPlayPromise
  })
})
