import { useEffect, useState } from 'react'
import { siteConfig } from './config/site.js'
import { getApiHealth } from './services/api.js'
import './App.css'

function App() {
  const [health, setHealth] = useState({ status: 'loading' })

  useEffect(() => {
    document.title = `${siteConfig.name} | ${siteConfig.tagline}`
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    getApiHealth({ signal: controller.signal })
      .then(setHealth)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setHealth({ status: 'error', message: error.message })
        }
      })

    return () => controller.abort()
  }, [])

  const apiIsReady = health.status === 'ok'

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label={`${siteConfig.name} home`}>
          {siteConfig.name}
        </a>
        <span className="topbar-label">MERN FOUNDATION</span>
      </header>

      <section className="welcome" aria-labelledby="welcome-title">
        <p className="eyebrow">A thoughtful starting point</p>
        <h1 id="welcome-title">Build something <em>memorable.</em></h1>
        <p className="intro">
          Your React client and Express API are connected and ready to grow.
          This reusable foundation keeps application code organized and
          configuration out of source files.
        </p>

        <div
          className={`connection-card ${apiIsReady ? 'is-ready' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-indicator" aria-hidden="true" />
          <div>
            <p className="connection-title">
              {health.status === 'loading'
                ? 'Checking the API'
                : apiIsReady
                  ? 'API and database connected'
                  : 'API connection unavailable'}
            </p>
            <p className="connection-detail">
              {health.status === 'loading'
                ? 'Waiting for the backend health check.'
                : apiIsReady
                  ? 'The client reached Express and MongoDB is ready.'
                  : health.message || 'Start the backend and check your environment settings.'}
            </p>
          </div>
        </div>

        <div className="stack-list" aria-label="Application stack">
          <span>React</span>
          <span>Express</span>
          <span>Node.js</span>
          <span>MongoDB</span>
        </div>
      </section>

      <footer className="footer">
        <span>{siteConfig.name}</span>
        <span>MERN application foundation</span>
      </footer>
    </main>
  )
}

export default App
