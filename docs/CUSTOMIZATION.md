# Customizable Mapping Reference

This document explains every row in the Mapping panel: what it controls, how the
value is calculated, its valid range, and how changing it affects the sound.

The mapping is applied independently to each CSV row. Every mapped column is
first normalized to `[0, 1]` with min–max:

```text
n = (x - min) / (max - min)
```

A constant column maps to `0.5`. Values outside the observed range are clamped.

---

## Quick reference

| UI row         | MIDI parameter               | Default          | UI range                         |
| -------------- | ---------------------------- | ---------------- | -------------------------------- |
| Pitch          | Note number `0–127`          | C4–A5 pentatonic | root C3–C6, 1–5 octaves          |
| Velocity       | Note velocity `1–127`        | 30–120           | 1–127                            |
| Duration       | Note length in beats         | 0.25–0.9         | 0.05–16 beats                    |
| Time           | Note onset in beats          | one beat per row | 0.1–16 beats/row, or 0–128 beats |
| Instrument     | General MIDI program `0–127` | Piano (0)        | fixed preset or column palette   |
| Global → Tempo | Playback speed               | 100 BPM          | 20–300 BPM                       |

A column can drive more than one parameter. Unused columns stay in the dataset
and table but do not affect the MIDI.

---

## Pitch

**Controls:** column, root note, octaves, scale.

**What it changes:** the MIDI note number, which determines the perceived
height of the note.

**Formula:**

```text
D      = scale.length * octaves
k      = min(D - 1, floor(n * D))
octave = floor(k / scale.length)
note   = rootNote + 12 * octave + scale[k % scale.length]
```

**Defaults:** root `60` (C4), 2 octaves, C major pentatonic `[0, 2, 4, 7, 9]`.

With the default scale and two octaves, there are `5 × 2 = 10` possible pitch
levels. The range is C4–A5, about 261.63–880 Hz.

**How changes sound:**

| Lower value        | Higher value          |
| ------------------ | --------------------- |
| lower note, darker | higher note, brighter |

**Root note** shifts the entire melody. C4 is a neutral middle register; lower
roots sound darker, higher roots sound thinner.

**Octaves** controls how many scale repetitions are available. More octaves
mean more pitch levels but wider jumps and a higher top note.

**Scale** controls which semitones are allowed:

- major pentatonic — consonant, no semitones or tritone;
- minor pentatonic — darker;
- major / natural minor — more resolution, some semitone steps;
- chromatic — maximum resolution, least consonant.

**Caveats:**

- The mapping is quantized: several data values can produce the same note.
- The mapping is dataset-relative; an outlier can compress the melody.
- The top note is clamped to MIDI `127`.

---

## Velocity

**Controls:** column, minimum, maximum.

**What it changes:** MIDI velocity, which controls loudness and, on many
instruments, brightness/timbre.

**Formula:**

```text
velocity = round(vmin + (vmax - vmin) * n)
```

**Default:** `30–120`.

**How changes sound:**

| Lower value     | Higher value          |
| --------------- | --------------------- |
| quieter, softer | louder, more forceful |

**Valid range:** `1–127`. MIDI `0` means note-off, so it is not used as a
velocity value.

**Caveats:**

- Velocity is not linear in perceived loudness; the difference between 30 and
  120 is large.
- Very low values (`1–20`) can be inaudible; very high values (`121–127`) leave
  no headroom.
- Avoid setting `min > max`, though the form prevents it.

---

## Duration

**Controls:** column, minimum beats, maximum beats.

**What it changes:** how long each note is held, measured in beats.

**Formula:**

```text
durationBeats = dmin + (dmax - dmin) * n
```

**Default:** `0.25–0.9` beats.

At 100 BPM:

- `0.25` beat = 150 ms;
- `0.9` beat = 540 ms.

**How changes sound:**

| Lower value     | Higher value    |
| --------------- | --------------- |
| short, staccato | long, sustained |

**Caveats:**

- In row-grid time mode, if `maxBeats` is greater than `beatsPerRow`, notes
  overlap and create chords or legato.
- Duration is independent of tempo: the note length in beats stays the same,
  but its length in seconds changes with BPM.
- Values must be positive.

---

## Time

**Controls:** mode, beats per row, or column and beat range.

**What it changes:** the note onset, i.e. when the note starts.

### Row grid mode

```text
timeBeats = rowIndex * beatsPerRow
```

**Default:** `beatsPerRow = 1`.

Each row becomes one note on a steady grid. This is the simplest and most
predictable mode.

| Beats per row | Effect                     |
| ------------: | -------------------------- |
|        `0.25` | fast, sixteenth-note pulse |
|           `1` | one note per beat          |
|           `2` | slow, half-note pulse      |

### From column mode

```text
timeBeats = minBeats + (maxBeats - minBeats) * n
```

This places notes according to a numeric column, such as a timestamp or a
sequence number.

**Default when switching:** `0–16` beats.

**Caveats:**

- If the column is not sorted, notes can appear out of CSV order. `buildMidi`
  sorts events by tick, so the file remains valid, but the melodic contour may
  no longer follow the original row order.
- Gaps in the column become rests; large gaps can create long silences.
- In this mode, `beatsPerRow` is ignored.

---

## Instrument

**Controls:** mode, fixed program, or column and program palette.

**What it changes:** the General MIDI program, which selects the instrument
timbre.

### Fixed mode

Every note uses one program. The default is `0` (Acoustic Grand Piano).

| Program | Instrument |
| ------: | ---------- |
|       0 | Piano      |
|      24 | Guitar     |
|      40 | Violin     |
|      48 | Strings    |
|      56 | Trumpet    |
|      73 | Flute      |
|      81 | Saw lead   |
|      88 | Warm pad   |

### From column mode

The normalized value selects a program from the checked palette:

```text
j       = min(programs.length - 1, floor(n * programs.length))
program = programs[j]
```

With `programs = [0, 24, 40]`:

```text
n < 0.33   → Piano
n < 0.66   → Guitar
otherwise  → Violin
```

The palette is ordered from low data values to high data values. At least one
program must remain checked.

**How changes sound:**

| Lower value               | Higher value             |
| ------------------------- | ------------------------ |
| first selected instrument | last selected instrument |

**Caveats:**

- Each program becomes a separate MIDI track.
- More instruments mean more tracks and more channel assignments.
- Instrument changes are per note, so a rapidly changing column can sound
  fragmented.
- General MIDI programs are only meaningful if the player or synth respects
  program changes.

---

## Tempo (Global)

**Controls:** BPM.

**What it changes:** playback speed, not the note mapping itself.

**Formula:**

```text
secondsPerBeat = 60 / BPM
microsecondsPerBeat = floor(60_000_000 / BPM)
```

**Default:** `100 BPM`.

**Valid range:** `20–300 BPM`.

**How changes sound:**

| Lower BPM      | Higher BPM          |
| -------------- | ------------------- |
| slower, calmer | faster, more urgent |

**Caveats:**

- Tempo does not change pitch, velocity, or the order of notes.
- It only changes how many seconds each beat lasts.
- Tempo is global, so one value applies to the whole file.

---

## A five-column example

For a file with:

```csv
energy,valence,danceability,texture,timestamp
```

a complete mapping could be:

| Column         | Parameter  | Setting                              |
| -------------- | ---------- | ------------------------------------ |
| `energy`       | Pitch      | root C4, 2 octaves, major pentatonic |
| `valence`      | Velocity   | 30–120                               |
| `danceability` | Duration   | 0.25–0.9 beats                       |
| `texture`      | Instrument | from column, Piano/Guitar/Violin     |
| `timestamp`    | Time       | from column, 0–16 beats              |

Every column now affects the output. If a column is not musically meaningful,
leave it unmapped; it remains visible in the data table but does not change the
MIDI.

---

## Validation limits

| Field              | Valid values                        |
| ------------------ | ----------------------------------- |
| Root note          | `0–127` (UI offers C3–C6)           |
| Octaves            | integer `1–6` (UI offers 1–5)       |
| Scale degrees      | integers `0–11`, strictly ascending |
| Velocity           | `1–127`                             |
| Duration           | positive beats                      |
| Time range         | `0 ≤ minBeats ≤ maxBeats`           |
| Instrument program | integer `0–127`                     |
| Tempo              | `20–300`                            |

The form clamps values where possible; `sonificationConfigSchema` performs the
final validation before generation.

---

## Ukrainian quick reference

| Параметр   | Що змінює                                                  |
| ---------- | ---------------------------------------------------------- |
| Pitch      | Висоту ноти; нижчі значення — нижчий регістр, вищі — вищий |
| Velocity   | Гучність і яскравість ноти (1–127)                         |
| Duration   | Тривалість ноти в долях                                    |
| Time       | Момент початку ноти: рівна сітка або значення колонки      |
| Instrument | Тембр General MIDI: фіксований або з колонки               |
| Tempo      | Швидкість відтворення в BPM                                |

Правила перетворення: кожна колонка нормалізується за min–max до `[0, 1]`,
після чого відображається на відповідний параметр MIDI. Колонки, які не
призначені користувачем, у соніфікації не беруть участі.

---

## Preview vs. real MIDI playback

The **Play** button in the app uses Tone.js synthesizers. It is a preview, not a
General MIDI renderer. The instrument programs are approximated with different
oscillators, envelopes, filters, and effects, but they are still synthesized
tones.

The saved `.mid` file contains the real General MIDI program numbers. In a DAW,
MuseScore, or an online MIDI player with a GM soundfont, the same file will use
sampled instruments and can sound substantially different.

The app shows this notice above the piano roll. After saving, **Open in player**
sends the `.mid` to the operating system’s default MIDI application.

---

## Related documents

- [`ALGORITHM.md`](./ALGORITHM.md) — the full numeric-to-MIDI pipeline and design
  rationale.
