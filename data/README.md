# Sample datasets

These CSV files are small, offline examples for the Data Sonifier. Every column
is numeric because the current loader requires numeric cells. For date-like
columns, a numeric index (`year`, `session`, `event`, `hour`, `track`) is used
instead of a date string.

Open any of them with **Open CSV** in the app.

| File                     | Rows | Indicators                                  | Suggested mapping                                                                        |
| ------------------------ | ---: | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `weather.csv`            |   16 | temperature, humidity, pressure             | temperature → pitch, humidity → velocity, pressure → duration                            |
| `climate.csv`            |   21 | CO₂ ppm, temperature anomaly, sea level     | CO₂ → pitch, anomaly → velocity, sea level → duration, year → time                       |
| `finance.csv`            |   24 | price, volume, volatility                   | price → pitch, volume → velocity, volatility → duration, session → time                  |
| `seismic.csv`            |   20 | magnitude, depth, distance                  | magnitude → pitch, depth → velocity, distance → duration, event → time                   |
| `air-quality.csv`        |   24 | PM2.5, PM10, NO₂, temperature               | PM2.5 → pitch, NO₂ → velocity, temperature → duration, hour → time                       |
| `music-features.csv`     |   20 | energy, valence, danceability, acousticness | energy → pitch, valence → velocity, danceability → duration, acousticness → instrument   |
| `headerless-example.csv` |   10 | three unnamed indicators                    | uncheck **First row is header**; column1 → pitch, column2 → velocity, column3 → duration |
| `smth.csv`               |    7 | five generic numeric columns                | a quick test file for arbitrary mappings                                                 |

## Why these datasets

These domains are common in data sonification:

- **Climate** — long-term trends are easy to hear as a rising or falling line.
- **Finance** — price, volume, and volatility have natural high/low contrasts.
- **Seismology** — magnitude, depth, and distance are standard physical measures.
- **Air quality** — hourly pollution patterns produce clear daily contours.
- **Music features** — the indicators are already perceptual descriptors, so the
  mapping to pitch, velocity, and timbre is easy to explain.

## Headerless files

`headerless-example.csv` has no header row. Uncheck **First row is header**
before clicking **Open CSV**. The loader will name the columns `column1`,
`column2`, … and treat every row as data. This avoids losing the first row.

The app also warns you if the “header” looks entirely numeric, which usually
means the file has no header.

## One-click presets

The app’s empty screen shows a card for each sample. Clicking a card loads the
CSV and applies its suggested mapping in one step. The toolbar also has a
**Load sample…** dropdown for switching datasets later.

## CLI

The same presets are available from the terminal:

```powershell
npm run sonify -- --input data/climate.csv --out out/climate.mid
npm run sonify -- --preset music-features --out out/music-features.mid
npm run sonify -- --preset headerless --out out/headerless.mid
npm run sonify -- --list-presets
```

If `--input` points to a bundled sample file, its preset mapping is applied
automatically. Use `--config mapping.json` to supply a custom mapping, and
`--headerless` for files without a header row.

## Suggested experiment

1. Open `climate.csv`.
2. Map `co2_ppm` to pitch, `temperature_anomaly` to velocity, and
   `sea_level_mm` to duration.
3. Set Time to `year` with a range of `0–20` beats.
4. Play the preview, then save the `.mid` and open it in a real MIDI player to
   compare the synth preview with General MIDI playback.
