import { useCallback, useEffect, useRef, useState } from 'react'
import type { NoteEvent } from '@core/types'
import { toMessage } from '../lib/format'
import { playNotes, type PlaybackHandle } from '../lib/playback'
import type { UsePlaybackProps } from '../typedefs/usePlayback.typedefs'

export interface PlaybackControls {
  playing: boolean
  progress: number
  play: (notes: readonly NoteEvent[], tempo: number) => Promise<void>
  stop: () => void
}

export function usePlayback({ onError }: UsePlaybackProps): PlaybackControls {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const playbackRef = useRef<PlaybackHandle | null>(null)
  const rafRef = useRef<number | null>(null)
  const playingRef = useRef(false)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    playbackRef.current?.stop()
    playbackRef.current = null
    playingRef.current = false
    setPlaying(false)
    setProgress(0)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      playbackRef.current?.stop()
    }
  }, [])

  const play = useCallback(
    async (notes: readonly NoteEvent[], tempo: number): Promise<void> => {
      if (playingRef.current) {
        stop()
        return
      }
      if (notes.length === 0) return

      stop()

      try {
        const handle = await playNotes(notes, tempo)
        playbackRef.current = handle
        playingRef.current = true
        setPlaying(true)

        const started = performance.now()
        const totalMs = Math.max(1, handle.durationSeconds * 1000)

        const tick = (now: number): void => {
          const next = Math.min(1, (now - started) / totalMs)
          setProgress(next)

          if (next < 1) {
            rafRef.current = requestAnimationFrame(tick)
          } else {
            stop()
          }
        }

        rafRef.current = requestAnimationFrame(tick)
      } catch (error) {
        stop()
        onErrorRef.current?.(toMessage(error))
      }
    },
    [stop]
  )

  return { playing, progress, play, stop }
}
