import { useStore } from '../store'

export default function Dashboard({ onNav }: { onNav: (t: 'providers' | 'probe') => void }) {
  const providers = useStore((s) => s.providers)
  const tokenCount = providers.reduce((sum, p) => sum + p.tokens.length, 0)

  const okProviders = providers.filter((p) => p.lastProbe?.ok).length

  const cards = [
    { icon: '🏯', label: '分舵（公益站）', value: providers.length, sub: `${okProviders} 个探子报平安`, go: 'providers' as const },
    { icon: '🪙', label: '令牌（API Key）', value: tokenCount, sub: '分舵发的通行凭证', go: 'providers' as const },
  ]

  return (
    <div className="dashboard">
      <div className="cards">
        {cards.map((c) => (
          <button key={c.label} className="card" onClick={() => onNav(c.go)}>
            <div className="card-icon">{c.icon}</div>
            <div className="card-value">{c.value}</div>
            <div className="card-label">{c.label}</div>
            <div className="card-sub">{c.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
