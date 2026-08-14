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
          message: '该分舵尚未添加令牌，无法检测',
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
          <h3>🕵️ 接口连通性检测</h3>
          <button className="primary" onClick={probeAll} disabled={probing !== null || providers.length === 0}>
            {probing !== null ? '检测中…' : '检测全部分舵'}
          </button>
        </div>
        {providers.length === 0 ? (
          <p className="empty">尚未登记公益站。请先前往「分舵」添加站点和令牌。</p>
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
                    ? '检测中…'
                    : p.lastProbe
                      ? (p.lastProbe.ok ? '🟢 可用' : '🔴 不可用')
                      : '⚪ 未检测',
              },
              {
                key: 'latency',
                title: '延迟',
                render: (p) => (p.lastProbe && p.lastProbe.latencyMs ? `${p.lastProbe.latencyMs}ms` : '—'),
              },
              { key: 'message', title: '检测详情', render: (p) => p.lastProbe?.message ?? '—' },
            ]}
            actions={(p) => (
              <button onClick={() => runProbe(p)} disabled={probing !== null}>
                立即检测
              </button>
            )}
          />
        )}
        <p className="hint">
          每个分舵使用首个令牌检测已登记的全部模型。请求由浏览器直接发送，目标站点必须允许跨域访问（CORS）。
        </p>
      </div>
    </div>
  )
}
