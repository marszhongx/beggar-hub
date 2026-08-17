import { useStore } from '../store'
import { useTranslation } from 'react-i18next'

export default function Dashboard({ onNav }: { onNav: (t: 'providers' | 'probe') => void }) {
  const { t } = useTranslation()
  const providers = useStore((s) => s.providers)
  const probeHistory = useStore((s) => s.probeHistory)
  const tokenCount = providers.reduce((sum, p) => sum + p.tokens.length, 0)

  const okProviders = providers.filter((p) => {
    const h = probeHistory[p.id]
    return h && h.length > 0 ? h[h.length - 1].ok : false
  }).length
  const probedProviders = providers.filter((p) => (probeHistory[p.id]?.length ?? 0) > 0).length

  const cards = [
    {
      icon: '🏯',
      label: t('dashboard.providersLabel'),
      value: providers.length,
      sub:
        providers.length === 0
          ? t('dashboard.providersEmpty')
          : probedProviders === 0
            ? t('dashboard.providersUnprobed')
            : t('dashboard.providersProbed', { ok: okProviders, total: probedProviders }),
      go: 'providers' as const,
    },
    {
      icon: '🪙',
      label: t('dashboard.tokensLabel'),
      value: tokenCount,
      sub: tokenCount > 0 ? t('dashboard.tokensSub') : t('dashboard.tokensEmpty'),
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
