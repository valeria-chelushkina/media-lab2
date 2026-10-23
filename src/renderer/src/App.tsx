function App(): React.JSX.Element {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ♪
          </span>
          <div>
            <h1>Data Sonifier</h1>
            <p>Media Lab 2 · numeric data → MIDI</p>
          </div>
        </div>
        <span className="stack-badge">Electron · React · TypeScript</span>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>Project scaffold is ready</h2>
          <p>
            This window will host the workspace for loading a dataset, mapping at least two numeric
            indicators to MIDI parameters, previewing the result and saving a <code>.mid</code>{' '}
            file.
          </p>
          <ul>
            <li>
              <strong>Pitch</strong> — driven by the first indicator
            </li>
            <li>
              <strong>Velocity</strong> — driven by the second indicator
            </li>
            <li>
              <strong>Duration / instrument</strong> — optional additional indicators
            </li>
          </ul>
        </section>
      </main>

      <footer className="app-footer">v0.1.0 · runs locally, no browser required</footer>
    </div>
  )
}

export default App
