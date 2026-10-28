# Data Sonification Algorithm

This document describes exactly how numeric data becomes a Standard MIDI File
in this project, why the default musical parameters were chosen, and how the
pipeline can be made fully configurable.

---

## 1. Purpose

The app performs **sonification**: it converts non-musical numeric data into
sound. The input is a table with at least two numeric indicators. The output is
a `.mid` file that can be played by any MIDI player, DAW, or synthesizer.

The mapping is **deterministic**: the same data and configuration always produce
the same file. There is no randomness.

---

## 2. Pipeline

```text
CSV text
  │  parse + validate                         src/core/loadCsv.ts
  ▼
numeric rows
  │  per-column min/max + normalization       src/core/normalize.ts
  ▼
values in [0, 1]
  │  map to musical parameters                src/core/sonify.ts + scale.ts
  ▼
NoteEvent[]
  │  build tracks, ticks, tempo               src/core/buildMidi.ts
  ▼
Midi object
  │  serialize                                @tonejs/midi → midi-file
  ▼
out/weather.mid
```

Entry point for the demo:

```text
scripts/generate-demo.ts
  → data/weather.csv
  → out/weather.mid
```

---

## 3. Input

### 3.1 CSV requirements

- By default the first row is the header. Header names must be non-empty and
  unique.
- The UI has a **First row is header** toggle. When it is off, columns are named
  `column1`, `column2`, … and **every** row is treated as data.
- Every column must contain finite numbers.
- At least **two numeric columns** are required.
- Supported delimiters: `,`, `;`, and tab (auto-detected).
- UTF-8 BOM is stripped.
- Decimal commas are accepted (`12,5` → `12.5`).
- Quoted fields are supported.
- Empty cells and non-numeric values are rejected with row/column details.
- If the first row looks entirely numeric while header mode is on, the app shows
  a warning suggesting that the file may be headerless.

Example:

```csv
temperature,humidity,pressure
12.4,78,1014
11.8,81,1013
```

Parsed result:

```ts
{
  columns: ['temperature', 'humidity', 'pressure'],
  rows: [
    { temperature: 12.4, humidity: 78, pressure: 1014 },
    { temperature: 11.8, humidity: 81, pressure: 1013 }
  ]
}
```

Headerless example (`header: false`):

```csv
12,78,1014
13,80,1015
```

```ts
{
  columns: ['column1', 'column2', 'column3'],
  rows: [
    { column1: 12, column2: 78, column3: 1014 },
    { column1: 13, column2: 80, column3: 1015 }
  ]
}
```

Bundled examples are described in [`data/README.md`](../data/README.md).

---

## 4. Normalization

Each mapped column is normalized independently with min–max:

```text
n = (x - min) / (max - min)
```

Then clamped to `[0, 1]`.

For the sample dataset:

| Column      |  min |  max | span |
| ----------- | ---: | ---: | ---: |
| temperature | 10.5 | 21.8 | 11.3 |
| humidity    |   44 |   88 |   44 |
| pressure    | 1010 | 1016 |    6 |

First row:

```text
temperature: (12.4 - 10.5) / 11.3 = 0.1681
humidity:    (78   - 44)   / 44   = 0.7727
pressure:    (1014 - 1010) / 6    = 0.6667
```

Special cases:

- **Constant series** (`max === min`) → every value maps to `0.5`.
- **Out-of-range values** → clamped to `0` or `1`.
- **Non-finite values** → rejected.

Normalization is **dataset-relative**. Adding an extreme row rescales every
other value. For stable scientific mappings, use fixed domains instead (see
§13).

---

## 5. Mapping

### 5.1 Pitch

The pitch mapping quantizes the normalized value into a musical scale instead
of using raw semitones.

Default configuration:

```ts
rootNote = 60 // C4
octaves = 2
scale = [0, 2, 4, 7, 9] // C major pentatonic
```

Algorithm:

```text
D      = scale.length * octaves        // 5 * 2 = 10
k      = min(D - 1, floor(n * D))
octave = floor(k / scale.length)
note   = rootNote + 12 * octave + scale[k % scale.length]
```

Example with `n = 0.1681`:

```text
k      = floor(0.1681 * 10) = 1
octave = floor(1 / 5) = 0
note   = 60 + 0 + scale[1] = 60 + 2 = 62   // D4
```

With `n = 1.0`:

```text
k      = 9
octave = 1
note   = 60 + 12 + scale[4] = 81           // A5
```

Properties:

- **Monotonic**: a larger input never produces a lower note.
- **Quantized**: several input values can map to the same note.
- **Consonant**: the scale contains no semitones and no tritone.

### 5.2 Velocity

```text
velocity = round(vmin + (vmax - vmin) * n)
```

Default: `vmin = 30`, `vmax = 120`.

Example:

```text
humidity 78 → n = 0.7727
velocity = round(30 + 90 * 0.7727) = 100
```

MIDI velocity is stored as `1…127`; `0` means note-off.

### 5.3 Duration

```text
durationBeats = dmin + (dmax - dmin) * n
```

Default: `dmin = 0.25`, `dmax = 0.9`.

Example:

```text
pressure 1014 → n = 0.6667
duration = 0.25 + 0.65 * 0.6667 = 0.6833 beats
```

With `beatsPerRow = 1`, the maximum duration is below one beat, so notes do not
overlap.

### 5.4 Instrument

The instrument can be configured in two modes:

**Fixed** — every note uses the same General MIDI program:

```ts
instrument: { mode: 'fixed', program: 0 }
```

**From a column** — the normalized value selects a program by bucket:

```ts
instrument: { mode: 'field', field: 'texture', programs: [0, 24, 40] }
```

```text
j       = min(programs.length - 1, floor(n * programs.length))
program = programs[j]
```

Example with `programs = [0, 24]`:

```text
n < 0.5   → program 0   (Piano)
n >= 0.5  → program 24  (Guitar)
```

Each program becomes a separate MIDI track. The UI exposes a fixed-program
dropdown and a column mode with a selectable program palette.

### 5.5 Time

Time can be generated in two modes.

**Row grid** — one note per row:

```text
timeBeats = rowIndex * beatsPerRow
```

**From a column** — the normalized value is placed between two beat positions:

```text
timeBeats = minBeats + (maxBeats - minBeats) * normalization(field)
```

This allows a timestamp, tempo, or any other numeric column to determine note
onsets. If the column is not sorted, `buildMidi` still sorts events by tick.

### 5.6 Note event

Each row becomes:

```ts
interface NoteEvent {
  midi: number // 0..127
  velocity: number // 1..127
  timeBeats: number
  durationBeats: number
  instrument: number // General MIDI program 0..127
}
```

Example:

```ts
{
  midi: 62,
  velocity: 100,
  timeBeats: 0,
  durationBeats: 0.6833,
  instrument: 0
}
```

---

## 6. MIDI construction

### 6.1 Beats → seconds

`@tonejs/midi` accepts times in seconds:

```text
secondsPerBeat = 60 / BPM
time           = timeBeats * secondsPerBeat
duration       = durationBeats * secondsPerBeat
```

At 100 BPM, one beat is `0.6 s`.

### 6.2 Velocity → 0..1

The library expects normalized velocity:

```text
libraryVelocity = velocity / 127
```

During encoding, `@tonejs/midi` multiplies by 127 and floors the result.
Integer velocities `1..127` round-trip exactly.

### 6.3 Tracks and channels

Notes are grouped by instrument program. Each group becomes a MIDI track with:

- one MIDI channel (`0…15`, skipping channel `9`, reserved for percussion);
- a program change at tick 0;
- a track name;
- the notes of that group.

With one instrument, the file contains two MIDI tracks: the meta/tempo track
and the instrument track.

### 6.4 Tempo and time signature

```ts
midi.header.setTempo(100)
midi.header.timeSignatures = [{ ticks: 0, timeSignature: [4, 4] }]
```

MIDI stores tempo as microseconds per quarter note:

```text
microsecondsPerBeat = floor(60_000_000 / BPM)
```

At 100 BPM: `600_000`.

---

## 7. Standard MIDI File structure

`midi.toArray()` produces a Standard MIDI File (format 1).

```text
MThd  header chunk
  format         = 1
  numberOfTracks = 2
  ticksPerBeat   = 480

MTrk  meta track
  track name
  tempo           FF 51 03 09 27 C0
  time signature  FF 58 04 04 02 18 08
  end of track    FF 2F 00

MTrk  instrument track
  track name
  program change  C0 00
  note on         90 3E 64
  note off        80 3E 00
  ...
  end of track    FF 2F 00
```

Key details:

- The first four bytes are `MThd` (`4D 54 68 64`).
- Default PPQ (pulses per quarter note) is **480**.
- At constant tempo: `ticks = timeBeats * 480`.
- Delta times use MIDI variable-length quantity encoding.
- Note-on status is `0x90 | channel`; note-off is `0x80 | channel`.
- Program change is `0xC0 | channel`.
- Tempo meta event is `FF 51 03` followed by 3 bytes.
- Time signature meta event is `FF 58 04` followed by numerator, `log2(denominator)`,
  metronome, and thirty-seconds per quarter.

---

## 8. Worked example

Ranges: temperature `10.5–21.8`, humidity `44–88`, pressure `1010–1016`.

| Row | Temp | Hum | Press | Pitch norm | MIDI note   | Velocity | Duration |
| --: | ---: | --: | ----: | ---------: | ----------- | -------: | -------: |
|   1 | 12.4 |  78 |  1014 |      0.168 | **62 (D4)** |      100 |    0.683 |
|   8 | 13.2 |  72 |  1013 |      0.239 | **64 (E4)** |       87 |    0.575 |
|  13 | 21.4 |  45 |  1016 |      0.965 | **81 (A5)** |       32 |    0.900 |
|  14 | 21.8 |  44 |  1015 |      1.000 | **81 (A5)** |       30 |    0.792 |

At 100 BPM:

- row 1 starts at `0 s`, lasts `0.41 s`;
- row 13 starts at `7.2 s`, lasts `0.54 s`;
- row 14 starts at `7.8 s`, lasts `0.475 s`.

The result is a 16-note melody lasting about 9.34 seconds.

---

## 9. Why these defaults

These values are **perceptual design decisions**, not mathematical requirements.
They satisfy three constraints: audibility, consonance, and legibility.

### 9.1 Scale `[0, 2, 4, 7, 9]`

C major pentatonic (C, D, E, G, A).

- No semitones and no tritone, so any combination is consonant.
- 5 pitch classes per octave: a compromise between data resolution and
  musicality.
- Chromatic (12) preserves more detail but can sound dissonant.
- Major (7) has more resolution but includes semitones.

### 9.2 Root note `60`

MIDI 60 is C4 (middle C) in scientific pitch notation.

```text
f(n) = 440 * 2^((n - 69) / 12)
```

| Note | MIDI | Frequency |
| ---- | ---: | --------: |
| C4   |   60 | 261.63 Hz |
| A5   |   81 |    880 Hz |

This range is comfortable on laptop speakers and avoids muddy low notes and
piercing high notes.

Some DAWs label MIDI 60 as C3. The MIDI number is the portable value.

### 9.3 Octaves `2`

```text
5 degrees × 2 octaves = 10 distinct pitch levels
```

| Octaves | Levels | Effect                                    |
| ------: | -----: | ----------------------------------------- |
|       1 |      5 | too coarse                                |
|       2 |     10 | enough resolution, comfortable range      |
|       3 |     15 | more detail, wider leaps, higher top note |

Ten levels are enough to preserve the contour of a 16-row dataset without
unmusical jumps.

### 9.4 Velocity `30…120`

- `1…20` is too quiet and easily lost.
- `121…127` leaves no headroom and can sound harsh.
- `30…120` is audible, expressive, and bounded.

### 9.5 Duration `0.25…0.9` beats

With one beat per row:

- `0.25` beat = a short sixteenth note;
- `0.9` beat = almost a full beat, still detached.

A maximum below `1.0` prevents overlap and keeps the rhythm clear.

### 9.6 Tempo `100` BPM

- 16 rows × 1 beat = 16 beats.
- 100 BPM → about 9.6 seconds, a good demo length.
- 60 BPM would be too slow; 140 BPM too rushed.

Tempo is global, not per-note. Mapping a data column to tempo would change the
whole piece's energy rather than one dimension, so it is kept fixed by default.

### 9.7 Grid `beatsPerRow = 1`

Equal time per observation. A fixed grid avoids long silences caused by uneven
timestamps and makes the contour easy to follow.

### 9.8 Min–max normalization

The indicators have different units and ranges. Min–max maps all of them to
`[0, 1]`, preserves ordering, and uses the full musical range.

Trade-off: it is dataset-relative. Fixed domains are better when the same
mapping must be comparable across datasets.

### 9.9 Polarity

All mappings use **positive polarity**:

- higher temperature → higher pitch;
- higher humidity → higher velocity;
- higher pressure → longer duration.

This is the most intuitive direction and the easiest to explain.

---

## 10. Trade-offs and limitations

- **Lossy mapping**: pitch quantization, velocity rounding, and tick rounding
  mean the original numbers cannot be reconstructed from the MIDI.
- **Dataset-relative normalization**: outliers rescale everything.
- **One row = one note**: no harmony unless durations overlap.
- **Arbitrary aesthetics**: scale, ranges, and tempo are choices; they must be
  justified in the report.
- **Row order matters**: the CSV order defines the melody.
- **Quantization limits detail**: 10 pitch levels for 16 rows means repeats.

---

## 11. Customization

The core is parameterized: `SonificationConfig` is a plain object validated by
`zod`. The desktop app exposes it through the mapping editor in
`src/renderer/src/components/MappingEditor.tsx`.

For a per-control explanation (pitch, velocity, duration, time, instrument,
tempo), see [`CUSTOMIZATION.md`](./CUSTOMIZATION.md).

### 11.1 Configuration surface

```ts
interface SonificationConfig {
  tempo: number
  beatsPerRow: number
  pitch: {
    field: string
    rootNote: number
    octaves: number
    scale: number[]
  }
  velocity: {
    field: string
    min: number
    max: number
  }
  duration: {
    field: string
    minBeats: number
    maxBeats: number
  }
  time?: { mode: 'row' } | { mode: 'field'; field: string; minBeats: number; maxBeats: number }
  instrument?:
    { mode: 'fixed'; program: number } | { mode: 'field'; field: string; programs: number[] }
}
```

Every value above is editable in the Mapping panel:

- any column can drive pitch, velocity, duration, time, or instrument;
- the instrument is either a fixed program or a column split into a palette.

### 11.2 Presets and config files

Bundled sample presets live in `src/core/presets.ts`. Each preset contains the
CSV filename, whether it has a header, and a complete suggested mapping. The UI
exposes them through the **Load sample** dropdown and the sample cards on the
empty screen.

A JSON mapping can also be loaded through the CLI:

```powershell
npm run sonify -- --preset climate --config my-mapping.json
```

The file is validated with `sonificationConfigSchema` before `sonify()` runs.
Saving/exporting a mapping from the desktop UI is still pending.

```json
{
  "tempo": 100,
  "beatsPerRow": 1,
  "pitch": {
    "field": "temperature",
    "rootNote": 60,
    "octaves": 2,
    "scale": [0, 2, 4, 7, 9]
  },
  "velocity": { "field": "humidity", "min": 30, "max": 120 },
  "duration": { "field": "pressure", "minBeats": 0.25, "maxBeats": 0.9 },
  "time": { "mode": "row" },
  "instrument": { "mode": "fixed", "program": 0 }
}
```

### 11.3 Remaining extensions

**Normalization mode**

```ts
type Normalization =
  | { mode: 'minmax' }
  | { mode: 'fixed'; domains: Record<string, { min: number; max: number }> }
  | { mode: 'percentile'; low: number; high: number }
```

**Mapping curve** (per parameter)

```ts
type Curve = 'linear' | 'log' | 'exp'
```

**Custom scale editor**

The UI currently exposes scale presets. A future version can let the user toggle
the 12 pitch classes directly and derive a sorted custom scale.

**Multi-voice mapping**

One column per voice (melody, bass, harmony) would allow chords instead of a
single monophonic line.

### 11.4 UI status

| Part                            | Status      |
| ------------------------------- | ----------- |
| CSV loading and preview         | implemented |
| Headerless CSV toggle           | implemented |
| Column-to-parameter mapping     | implemented |
| Fixed / column instrument       | implemented |
| Time from row or column         | implemented |
| Tempo control                   | implemented |
| Piano-roll preview and playback | implemented |
| Open saved `.mid` in a player   | implemented |
| One-click sample presets        | implemented |
| CLI with `--input` / `--out`    | implemented |
| Saving config from the UI       | pending     |
| Normalization modes and curves  | pending     |

Validation runs through `sonificationConfigSchema` before generation. Invalid
ranges are clamped by the form, and any remaining schema error is shown in the
status line.

### 11.5 Preview and playback

The piano roll is an SVG rendered from the same `NoteEvent[]` used to build the
MIDI file:

- horizontal position = `timeBeats`;
- width = `durationBeats`;
- vertical position = MIDI note number;
- color = instrument program;
- opacity = velocity;
- vertical line = playback progress.

Playback is implemented with Tone.js in
`src/renderer/src/lib/playback.ts`:

1. `Tone.start()` resumes the audio context after the user clicks **Play**.
2. Each instrument program gets its own synthesis engine rather than one shared
   oscillator:
   - Piano: triangle `Synth` with a short decay.
   - Guitar: filtered `MonoSynth` with a plucked filter envelope.
   - Violin: `FMSynth` with vibrato and a small reverb.
   - Strings: `AMSynth` with chorus and reverb.
   - Trumpet: filtered `MonoSynth` with a brass-like filter envelope.
   - Flute: sine `Synth` with vibrato.
   - Saw lead: filtered sawtooth `Synth`.
   - Warm pad: slow-attack `AMSynth` with chorus and reverb.
3. Each note is scheduled on `Tone.Transport` with its start time, duration,
   and normalized velocity.
4. **Stop** cancels the transport and disposes the synths and effects.

The preview is still **synthetic**. It does not use General MIDI samples, so it
is labeled in the UI:

> Synth preview only. The saved `.mid` uses General MIDI and may sound different
> in a DAW or online player.

The generated `.mid` file remains the deliverable. After saving, **Open in
player** passes the file to the operating system (`shell.openPath`). If no MIDI
player is associated with `.mid`, the app reveals the file in its folder
instead.

Tone.js uses a Web Worker for its transport clock. The renderer Content Security
Policy must therefore include `worker-src 'self' blob:`. Without it the transport
silently fails to fire scheduled notes.

### 11.6 Persistence

In Electron, store the last config in:

```text
app.getPath('userData')/config.json
```

This survives restarts and keeps the app offline.

## 12. References

- Hermann, T., Hunt, A., & Neuhoff, J. G. (Eds.). _The Sonification Handbook_.
  Open access: <https://sonification.de/handbook/>
- ICAD — International Community for Auditory Display: <https://icad.org/>
- Sonification overview: <https://en.wikipedia.org/wiki/Sonification>
- Pentatonic scale: <https://en.wikipedia.org/wiki/Pentatonic_scale>
- Scientific pitch notation: <https://en.wikipedia.org/wiki/Scientific_pitch_notation>
- General MIDI: <https://en.wikipedia.org/wiki/General_MIDI>
- MIDI Association: <https://midi.org/>
- Walker, B. N., & Kramer, G. (2005). Mappings and metaphors in auditory
  displays: An experimental assessment. _ACM Transactions on Applied
  Perception_, 2(4), 407–412. <https://doi.org/10.1145/1101530.1101534>
- NASA sonifications: <https://www.nasa.gov/sonifications/>
- `@tonejs/midi`: <https://github.com/Tonejs/Midi>
- Tone.js: <https://tonejs.github.io/>

---

## Appendix: report-ready summary (Ukrainian)

> Оскільки соніфікація не має єдиного правильного відображення, параметри
> обрано за трьома критеріями: чутність, консонантність і розбірливість.
> Діапазон MIDI 60–81 (C4–A5, приблизно 262–880 Гц) є зручним для типових
> динаміків. Мажорна пентатоніка `[0, 2, 4, 7, 9]` не містить півтонів і
> тритону, тому будь-яке нормалізоване значення відображається в консонантний
> ступінь. Два октави дають 10 рівнів висоти — достатньо для збереження
> контуру 16 рядків без надмірно широких стрибків. Діапазони velocity 30–120
> та тривалості 0,25–0,9 долі забезпечують чутність і чітку артикуляцію на
> сітці одна доля на рядок при 100 BPM.
