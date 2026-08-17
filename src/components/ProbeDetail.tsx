import type { ModelProbeResult } from '../types'

/** 探报明细悬浮层（分舵页 / 探报页复用） */
export default function ProbeDetail({ models }: { models: ModelProbeResult[] }) {
  return (
    <div className="probe-detail-pop">
      {models.map((m, i) => (
        <div key={i} className={`probe-detail-row ${m.ok ? 'ok' : 'fail'}`}>
          <span>{m.ok ? '🟢' : '🔴'}</span>
          <span className="probe-detail-model">{m.model}</span>
          <span className="probe-detail-msg">{m.message}</span>
        </div>
      ))}
    </div>
  )
}