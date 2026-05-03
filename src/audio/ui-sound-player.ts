export type UiSoundPlayerLike = {
  play(audioPath: string): Promise<void>
}

function normalizeAudioUrl(audioPath: string) {
  if (
    audioPath.startsWith('data:') ||
    audioPath.startsWith('blob:') ||
    audioPath.startsWith('http://') ||
    audioPath.startsWith('https://')
  ) {
    return audioPath
  }

  return audioPath.startsWith('/') ? audioPath : `/${audioPath}`
}

export class UiSoundPlayer implements UiSoundPlayerLike {
  private activeAudio: HTMLAudioElement | null = null
  private resolveActivePlayback: (() => void) | null = null

  async play(audioPath: string): Promise<void> {
    if (typeof Audio === 'undefined') {
      return
    }

    this.stopActiveAudio()

    await new Promise<void>((resolve) => {
      const audio = new Audio(normalizeAudioUrl(audioPath))
      audio.preload = 'auto'
      this.activeAudio = audio

      const finish = () => {
        if (this.activeAudio === audio) {
          this.activeAudio = null
          this.resolveActivePlayback = null
        }

        audio.onended = null
        audio.onerror = null
        resolve()
      }

      this.resolveActivePlayback = finish
      audio.onended = finish
      audio.onerror = finish

      const playPromise = audio.play()

      if (playPromise) {
        playPromise.catch(() => {
          finish()
        })
      }
    })
  }

  private stopActiveAudio() {
    if (!this.activeAudio) {
      return
    }

    const audio = this.activeAudio
    const resolvePlayback = this.resolveActivePlayback

    this.activeAudio = null
    this.resolveActivePlayback = null
    audio.onended = null
    audio.onerror = null

    try {
      audio.pause()
      audio.currentTime = 0
    } catch {
      // Ignore best-effort cleanup failures from the runtime media element.
    }

    resolvePlayback?.()
  }
}

const sharedUiSoundPlayer = new UiSoundPlayer()

export function getUiSoundPlayer(): UiSoundPlayerLike {
  return sharedUiSoundPlayer
}
