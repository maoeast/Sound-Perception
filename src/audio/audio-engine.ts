export type PlayableAsset = {
  audioPath: string
  id: string
  title: string
}

export type AudioEngineLike = {
  playAsset(asset: PlayableAsset): Promise<void>
}

function normalizeAssetUrl(audioPath: string) {
  if (
    audioPath.startsWith('data:') ||
    audioPath.startsWith('blob:') ||
    audioPath.startsWith('http://') ||
    audioPath.startsWith('https://') ||
    audioPath.startsWith('asset:')
  ) {
    return audioPath
  }

  return audioPath.startsWith('/') ? audioPath : `/${audioPath}`
}

export class AudioEngine implements AudioEngineLike {
  private activeSource: AudioBufferSourceNode | null = null
  private bufferCache = new Map<string, AudioBuffer>()
  private context: AudioContext | null = null
  private gainNode: GainNode | null = null

  async playAsset(asset: PlayableAsset): Promise<void> {
    const context = this.getContext()

    if (!context) {
      return
    }

    if (context.state === 'suspended') {
      await context.resume()
    }

    try {
      const buffer = await this.loadBuffer(
        context,
        normalizeAssetUrl(asset.audioPath),
      )

      this.stopActiveSource()

      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(this.getGainNode(context))
      source.onended = () => {
        if (this.activeSource === source) {
          this.activeSource = null
        }
      }
      source.start(0)
      this.activeSource = source
    } catch {
      this.stopActiveSource()
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return null
    }

    this.context ??= new window.AudioContext()

    return this.context
  }

  private getGainNode(context: AudioContext): GainNode {
    if (!this.gainNode) {
      this.gainNode = context.createGain()
      this.gainNode.gain.value = 0.85
      this.gainNode.connect(context.destination)
    }

    return this.gainNode
  }

  private async loadBuffer(
    context: AudioContext,
    audioUrl: string,
  ): Promise<AudioBuffer> {
    const cachedBuffer = this.bufferCache.get(audioUrl)

    if (cachedBuffer) {
      return cachedBuffer
    }

    const response = await fetch(audioUrl)

    if (!response.ok) {
      throw new Error(`Unable to load audio asset: ${audioUrl}`)
    }

    const audioData = await response.arrayBuffer()
    const buffer = await context.decodeAudioData(audioData)

    this.bufferCache.set(audioUrl, buffer)

    return buffer
  }

  private stopActiveSource() {
    if (!this.activeSource) {
      return
    }

    this.activeSource.onended = null
    this.activeSource.stop()
    this.activeSource.disconnect()
    this.activeSource = null
  }
}

const sharedAudioEngine = new AudioEngine()

export function getAudioEngine(): AudioEngineLike {
  return sharedAudioEngine
}
