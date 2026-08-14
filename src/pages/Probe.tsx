import { useState } from 'react'
import { useStore } from '../store'
import { probe } from '../api'
import Table from '../components/Table'
import type { Provider } from '../types'

export default function Probe() {
  const providers = useStore((s) => s.providers)
  const updateProvider = useStore((s) => s.updateProvider)
  const [probing, setProbing] = useState<string | null>(null)

  // 取某分舵的一个令牌来做测试
  const pickToken = (p: Provider) => p.tokens[0]

  const runProbe = async (p: Provider) => {
    const token = pickToken(p)
    if (!token) {
      updateProvider(p.id, {
        lastProbe: {
          ok: false,
          latencyMs: 0,
          message: '该分舵没有令牌，无法测试',
          probedAt: Date.now(),
        },
      })
      return
    }
    setProbing(p.id)
    const r = await probe(p.baseUrl, token.key, token.type, token.models)
    updateProvider(p.id, { lastProbe: r })
    setProbing(null)
  }

  const probeAll = async () => {
    await Promise.all(providers.map((p) => runProbe(p)))
  }

  return (
    <div className="probe">
      <div className="panel">
        <div className="panel-head">
          <h3>🕵️ 探子来报</h3>
          <button className="primary" onClick={probeAll} disabled={probing !== null || providers.length === 0}>
            {probing !== null ? '巡视中…' : '全舵巡视'}
          </button>
        </div>
        {providers.length === 0 ? (
          <p className="empty">还没有分舵，去「分舵」登记公益站吧</p>
        ) : (
          <Table<Provider>
            rows={providers}
            rowKey={(p) => p.id}
            cols={[
              { key: 'name', title: '分舵' },
              {
                key: 'status',
                title: '状态',
                render: (p) =>
                  probing === p.id
                    ? '探访中…'
                    : p.lastProbe
                      ? (p.lastProbe.ok ? '🟢 平安' : '🔴 异常')
                      : '⚪ 未探访',
              },
              {
                key: 'latency',
                title: '延迟',
                render: (p) => (p.lastProbe && p.lastProbe.latencyMs ? `${p.lastProbe.latencyMs}ms` : '—'),
              },
              { key: 'message', title: '探报', render: (p) => p.lastProbe?.message ?? '—' },
            ]}
            actions={(p) => (
              <button onClick={() => runProbe(p)} disabled={probing !== null}>
                探一下
              </button>
            )}
          />
        )}
        <p className="hint">
          探子用该分舵的令牌（API Key）按令牌类型实测对话接口，对该令牌登记的所有模型逐个发最小对话测试，纯浏览器直连，需站点开启 CORS。
        </p>
      </div>
    </div>
  )
}
