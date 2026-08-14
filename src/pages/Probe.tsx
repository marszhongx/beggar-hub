import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import { probe } from '../api'
import Table from '../components/Table'
import type { Provider } from '../types'

export default function Probe() {
  const { t } = useTranslation()
  const providers = useStore((s) => s.providers)
  const updateProvider = useStore((s) => s.updateProvider)
  const [probing, setProbing] = useState<string | null>(null)

  const runProbe = async (p: Provider) => {
    if (p.tokens.length === 0) {
      updateProvider(p.id, {
        lastProbe: {
          ok: false,
          latencyMs: 0,
          message: t('probe.noToken'),
          probedAt: Date.now(),
        },
      })
      return
    }
    setProbing(p.id)
    // 探该分舵下所有令牌，每个令牌探其全部模型
    const results = await Promise.all(
      p.tokens.map((token) => probe(p.baseUrl, token.key, token.type, token.models))
    )
    const okAll = results.every((r) => r.ok)
    const okCount = results.filter((r) => r.ok).length
    const maxLatency = Math.max(...results.map((r) => r.latencyMs))
    const fail = results
      .filter((r) => !r.ok)
      .map((r) => r.message)
      .join('；')
    const message =
      results.length === 1
        ? results[0].message
        : okAll
          ? t('probe.allTokensOk', { ok: okCount, total: results.length })
          : t('probe.partialTokens', { ok: okCount, total: results.length, fail })
    updateProvider(p.id, {
      lastProbe: {
        ok: okAll,
        latencyMs: Math.round(maxLatency),
        message,
        probedAt: Date.now(),
      },
    })
    setProbing(null)
  }

  const probeAll = async () => {
    await Promise.all(providers.map((p) => runProbe(p)))
  }

  return (
    <div className="probe">
      <div className="panel">
        <div className="panel-head">
          <h3>🕵️ {t('probe.title')}</h3>
          <button className="primary" onClick={probeAll} disabled={probing !== null || providers.length === 0}>
            {probing !== null ? t('probe.probing') : t('probe.probeAll')}
          </button>
        </div>
        {providers.length === 0 ? (
          <p className="empty">{t('probe.empty')}</p>
        ) : (
          <Table<Provider>
            rows={providers}
            rowKey={(p) => p.id}
            cols={[
              { key: 'name', title: t('probe.colName') },
              {
                key: 'status',
                title: t('probe.colStatus'),
                render: (p) =>
                  probing === p.id
                    ? t('probe.probing')
                    : p.lastProbe
                      ? (p.lastProbe.ok ? t('probe.statusOk') : t('probe.statusFail'))
                      : t('probe.statusNone'),
              },
              {
                key: 'latency',
                title: t('probe.colLatency'),
                render: (p) => (p.lastProbe && p.lastProbe.latencyMs ? `${p.lastProbe.latencyMs}ms` : '—'),
              },
              { key: 'message', title: t('probe.colMessage'), render: (p) => p.lastProbe?.message ?? '—' },
            ]}
            actions={(p) => (
              <button onClick={() => runProbe(p)} disabled={probing !== null}>
                {t('probe.probeNow')}
              </button>
            )}
          />
        )}
        <p className="hint">
          {t('probe.hint')}
        </p>
      </div>
    </div>
  )
}
