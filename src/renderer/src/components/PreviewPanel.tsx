import { PianoRoll } from '@renderer/components/PianoRoll'
import type { Preview } from '@renderer/types'
interface PreviewPanelProps {
  preview: Preview
  playing: boolean
  progress: number
  onPlay: () => void
}

export function PreviewPanel({
  preview,
  playing,
  progress,
  onPlay
}: PreviewPanelProps): React.JSX.Element {
  return (
    <section className="panel preview-panel">
      <div className="panel-heading preview-heading">
        <div className="preview-title">
          <h2>Piano roll</h2>
          <span>
            {preview.error
              ? 'Mapping error'
              : `${preview.notes.length} notes · ${preview.durationSeconds.toFixed(2)} s`}
          </span>
        </div>

        <button
          type="button"
          className="button button-primary preview-play"
          onClick={onPlay}
          disabled={preview.notes.length === 0 || Boolean(preview.error)}
        >
          {playing ? 'Stop' : 'Play'}
        </button>
      </div>

      <p className="preview-note">
        Synth preview only. The saved <code>.mid</code> uses General MIDI and may sound different in
        a DAW or online player.
      </p>

      {preview.error ? (
        <p className="preview-error">{preview.error}</p>
      ) : (
        <PianoRoll notes={preview.notes} progress={progress} />
      )}
    </section>
  )
}
