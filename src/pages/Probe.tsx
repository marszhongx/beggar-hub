import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import { countProbeModels, probe } from '../api'
import Table from '../components/Table'
import ProbeDetail from '../components/ProbeDetail'
import type { ProbeResult, Provider } from '../types'

export default function Probe() {
  const { t } = useTranslation()
  const providers = useStore((s) => s.providers)
  const tokenProbes = useStore((s) => s.tokenProbes)
  const probeHistory = useStore((s) => s.probeHistory)
  const setTokenProbe = useStore((s) => s.setTokenProbe)
  const pushProbeHistory = useStore((s) => s.pushProbeHistory)
  // 正在探测的分舵集合（支持并发探测多个分舵互不干扰）
  const [probing, setProbing] = useState<Set<string>>(new Set())
  // 每个分舵的探测进度（providerId → { done, total }，跨令牌累计）
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({})

  const running = probing.size > 0
  // 「探全部分舵」只探启用监控的分舵
  const monitored = providers.filter((p) => p.monitor)

  const lastProbeOf = (id: string) => {
    const h = probeHistory[id]
    return h && h.length > 0 ? h[h.length - 1] : undefined
  }

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
    setProbing((prev) => new Set(prev).add(p.id))
    // 进度按整个分舵的所有模型数累计
    const total = p.tokens.reduce((n, token) => n + countProbeModels(token.models), 0)
    setProgress((prev) => ({ ...prev, [p.id]: { done: 0, total } }))
    try {
      let done = 0
      const results: ProbeResult[] = []
      // 令牌串行探测（共享进度不互相覆盖），令牌内部多模型仍并发
      for (const token of p.tokens) {
        const r = await probe(p.baseUrl, token.key, token.type, token.models, (d) => {
          setProgress((prev) => ({ ...prev, [p.id]: { done: done + d, total } }))
        })
        results.push(r)
        done += countProbeModels(token.models)
        // 每个令牌探完即时更新，方便分页查看明细
        setTokenProbe(token.id, r)
      }
      const okAll = results.every((r) => r.ok)
      const maxLatency = results.length > 0 ? Math.max(...results.map((r) => r.latencyMs)) : 0
      const models = results.flatMap((r) => r.models)
      pushProbeHistory(p.id, {
        ok: okAll,
        latencyMs: Math.round(maxLatency),
        probedAt: Date.now(),
        models,
      })
    } finally {
      setProbing((prev) => {
        const next = new Set(prev)
        next.delete(p.id)
        return next
      })
      setProgress((prev) => {
        const next = { ...prev }
        delete next[p.id]
        return next
      })
    }
  }

  const probeAll = async () => {
    await Promise.all(monitored.map((p) => runProbe(p)))
  }

  return (
    <div className="probe">
      <div className="panel">
        <div className="panel-head">
          <h3>🕵️ {t('probe.title')}</h3>
          <button className="primary" onClick={probeAll} disabled={running || monitored.length === 0}>
            {running ? t('probe.probing') : t('probe.probeAll')}
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
                  const lastProbe = lastProbeOf(p.id)
                  const pr = progress[p.id]
                  return probing.has(p.id) ? (
                    <span className="probe-progress">
                      <span className="probe-spinner" />
                      {pr && pr.total > 0 ? `${pr.done}/${pr.total}` : t('probe.probing')}
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
                  const lastProbe = lastProbeOf(p.id)
                  return lastProbe && lastProbe.latencyMs ? `${lastProbe.latencyMs}ms` : '—'
                },
              },
              {
                key: 'message',
                title: t('probe.colMessage'),
                render: (p) => {
                  const lastProbe = lastProbeOf(p.id)
                  const pr = progress[p.id]
                  return probing.has(p.id) && pr && pr.total > 0 ? (
                    <div className="probe-bar">
                      <div
                        className="probe-bar-fill"
                        style={{ width: `${Math.round((pr.done / pr.total) * 100)}%` }}
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
                      {lastProbe.models.length > 0 && <ProbeDetail models={lastProbe.models} />}
                    </div>
                  ) : (
                    '—'
                  )
                },
              },
            ]}
            actions={(p) => (
              <button onClick={() => runProbe(p)} disabled={running}>
                {t('probe.probeNow')}
              </button>
            )}
          />
        )}
        <p className="hint">
          {t('probe.hint')}
        </p>
        {providers.length > 0 && providers.some((p) => !p.monitor) && (
          <p className="hint">{t('probe.hintMonitor')}</p>
        )}
      </div>
    </div>
  )
}