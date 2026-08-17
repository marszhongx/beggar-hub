import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import { probe } from '../api'
import Table from '../components/Table'
import type { Provider } from '../types'

export default function Probe() {
  const { t } = useTranslation()
  const providers = useStore((s) => s.providers)
  const tokenProbes = useStore((s) => s.tokenProbes)
  const probeHistory = useStore((s) => s.probeHistory)
  const setTokenProbe = useStore((s) => s.setTokenProbe)
  const pushProbeHistory = useStore((s) => s.pushProbeHistory)
  const [probing, setProbing] = useState<string | null>(null)
  // 探测进度：{ done, total }
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const runProbe = async (p: Provider) => {
    if (p.tokens.length === 0) {
      pushProbeHistory(p.id, {
        ok: false,
        latencyMs: 0,
        probedAt: Date.now(),
        models: [],
      })
      return
    }
    setProbing(p.id)
    setProgress({ done: 0, total: 0 })
    // 探该分舵下所有令牌，每个令牌探其全部模型
    const results = await Promise.all(
      p.tokens.map((token) =>
        probe(p.baseUrl, token.key, token.type, token.models, (done, total) => {
          setProgress({ done, total })
        })
      )
    )
    const okAll = results.every((r) => r.ok)
    const maxLatency = Math.max(...results.map((r) => r.latencyMs))
    const models = results.flatMap((r) => r.models)
    // 记录每个令牌的探报
    p.tokens.forEach((token, i) => {
      setTokenProbe(token.id, results[i])
    })
    // 记录分舵最近一次汇总探报
    pushProbeHistory(p.id, {
      ok: okAll,
      latencyMs: Math.round(maxLatency),
      probedAt: Date.now(),
      models,
    })
    setProbing(null)
    setProgress(null)
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
                render: (p) => {
                  const lastProbe = probeHistory[p.id]?.[probeHistory[p.id]!.length - 1]
                  return probing === p.id ? (
                    <span className="probe-progress">
                      <span className="probe-spinner" />
                      {progress && progress.total > 0
                        ? `${progress.done}/${progress.total}`
                        : t('probe.probing')}
                    </span>
                  ) : lastProbe ? (
                    <span className={lastProbe.ok ? 'status-ok' : 'status-fail'}>
                      {lastProbe.ok ? '🟢' : '🔴'} {lastProbe.ok ? t('probe.statusOk') : t('probe.statusFail')}
                    </span>
                  ) : (
                    <span className="status-none">⚪ {t('probe.statusNone')}</span>
                  )
                },
              },
              {
                key: 'latency',
                title: t('probe.colLatency'),
                render: (p) => {
                  const lastProbe = probeHistory[p.id]?.[probeHistory[p.id]!.length - 1]
                  return lastProbe && lastProbe.latencyMs ? `${lastProbe.latencyMs}ms` : '—'
                },
              },
              {
                key: 'message',
                title: t('probe.colMessage'),
                render: (p) => {
                  const lastProbe = probeHistory[p.id]?.[probeHistory[p.id]!.length - 1]
                  return probing === p.id && progress && progress.total > 0 ? (
                    <div className="probe-bar">
                      <div
                        className="probe-bar-fill"
                        style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                      />
                    </div>
                  ) : lastProbe ? (
                    <div className="probe-detail">
                      <span>
                        {lastProbe.models.length === 0
                          ? t('probe.noToken')
                          : `${t('probe.tokenCount', {
                              ok: p.tokens.filter((tok) => tokenProbes[tok.id]?.ok).length,
                              total: p.tokens.length,
                            })}，${t('api.modelCount', {
                              ok: lastProbe.models.filter((m) => m.ok).length,
                              total: lastProbe.models.length,
                            })}`}
                      </span>
                      {lastProbe.models.length > 0 && (
                        <div className="probe-detail-pop">
                          {lastProbe.models.map((m, i) => (
                            <div key={i} className={`probe-detail-row ${m.ok ? 'ok' : 'fail'}`}>
                              <span>{m.ok ? '🟢' : '🔴'}</span>
                              <span className="probe-detail-model">{m.model}</span>
                              <span className="probe-detail-msg">{m.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    '—'
                  )
                },
              },
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
