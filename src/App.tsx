import { useState } from 'react'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import Providers from './pages/Providers'
import Probe from './pages/Probe'
import Transfer from './pages/Transfer'

type Tab = 'dashboard' | 'providers' | 'probe' | 'transfer'

const NAV: { key: Tab; icon: string; label: string; desc: string }[] = [
  { key: 'dashboard', icon: '⚔️', label: '聚义厅', desc: '总览' },
  { key: 'providers', icon: '🏯', label: '分舵', desc: '公益站与令牌' },
  { key: 'probe', icon: '🕵️', label: '探子来报', desc: '站点监控' },
  { key: 'transfer', icon: '🧘', label: '传功', desc: '导入导出' },
]

const SLOGAN = '天下英雄，尽入吾彀中。'
const SLOGAN2 = '打狗棒在手，Token全都有。'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const providers = useStore((s) => s.providers)
  const tokenCount = providers.reduce((sum, p) => sum + p.tokens.length, 0)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-row">
            <div className="logo">🥣</div>
            <div className="brand-title">丐帮</div>
          </div>
          <div className="brand-slogan">{SLOGAN2}</div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${tab === n.key ? 'active' : ''}`}
              onClick={() => setTab(n.key)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">
                {n.label}
                <em>{n.desc}</em>
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-stats">
          <div>分舵 <b>{providers.length}</b></div>
          <div>令牌 <b>{tokenCount}</b></div>
        </div>
        <div className="disclaimer-mini">仅技术研究，密钥自备，风险自担</div>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>{NAV.find((n) => n.key === tab)?.label}</h1>
          <div className="slogan">{SLOGAN}</div>
        </header>
        {tab === 'dashboard' && <Dashboard onNav={setTab} />}
        {tab === 'providers' && <Providers />}
        {tab === 'probe' && <Probe />}
        {tab === 'transfer' && <Transfer />}
      </main>
    </div>
  )
}
