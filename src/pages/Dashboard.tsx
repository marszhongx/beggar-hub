import { useStore } from '../store'

export default function Dashboard({ onNav }: { onNav: (t: 'providers' | 'probe') => void }) {
  const providers = useStore((s) => s.providers)
  const tokenCount = providers.reduce((sum, p) => sum + p.tokens.length, 0)

  const okProviders = providers.filter((p) => p.lastProbe?.ok).length
  const probedProviders = providers.filter((p) => p.lastProbe).length

  const cards = [
    {
      icon: '🏯',
      label: '分舵（公益站）',
      value: providers.length,
      sub:
        providers.length === 0
          ? '尚未登记公益站'
          : probedProviders === 0
            ? '尚未进行连通性检测'
            : `${okProviders}/${probedProviders} 个已检测站点可用`,
      go: 'providers' as const,
    },
    {
      icon: '🪙',
      label: '令牌（API Key）',
      value: tokenCount,
      sub: tokenCount > 0 ? '用于访问模型接口' : '尚未添加访问凭证',
      go: 'providers' as const,
    },
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
