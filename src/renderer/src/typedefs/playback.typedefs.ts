export interface PlaybackVoice {
  trigger: (frequency: string, duration: number, time: number, velocity: number) => void
  releaseAll: () => void
  dispose: () => void
}

export interface PlaybackHandle {
  durationSeconds: number
  stop: () => void
}
