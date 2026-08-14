import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from './store'
import { LANGUAGES } from './i18n'
import Dashboard from './pages/Dashboard'
import Providers from './pages/Providers'
import Probe from './pages/Probe'
import Transfer from './pages/Transfer'

type Tab = 'dashboard' | 'providers' | 'probe' | 'transfer'

const NAV: { key: Tab; icon: string }[] = [
  { key: 'dashboard', icon: '⚔️' },
  { key: 'providers', icon: '🏯' },
  { key: 'probe', icon: '🕵️' },
  { key: 'transfer', icon: '🧘' },
]

export default function App() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<Tab>('dashboard')
  const providers = useStore((s) => s.providers)
  const tokenCount = providers.reduce((sum, p) => sum + p.tokens.length, 0)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-row">
            <div className="logo">🥣</div>
            <div className="brand-title">{t('app.brand')}</div>
          </div>
          <div className="brand-slogan">{t('app.slogan2')}</div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${tab === n.key ? 'active' : ''}`}
              onClick={() => setTab(n.key)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{t(`app.nav.${n.key}`)}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-stats">
          <div>{t('app.statsProviders')} <b>{providers.length}</b></div>
          <div>{t('app.statsTokens')} <b>{tokenCount}</b></div>
        </div>
        <div className="lang-switch">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={i18n.language === l.code ? 'active' : ''}
              onClick={() => i18n.changeLanguage(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="disclaimer-mini">{t('app.disclaimer')}</div>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>{t(`app.nav.${tab}`)}</h1>
          <div className="slogan">{t('app.slogan')}</div>
        </header>
        {tab === 'dashboard' && <Dashboard onNav={setTab} />}
        {tab === 'providers' && <Providers />}
        {tab === 'probe' && <Probe />}
        {tab === 'transfer' && <Transfer />}
      </main>
    </div>
  )
}
