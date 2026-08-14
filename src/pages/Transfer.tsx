import { useState } from 'react'
import { useStore } from '../store'

export default function Transfer() {
  const importAll = useStore((s) => s.importAll)
  const providers = useStore((s) => s.providers)
  const state = { providers }
  const [json, setJson] = useState('')
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const data = JSON.stringify(state, null, 2)
    setJson(data)
    setMsg('导出文本已生成，请复制并妥善保存。')
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `beggar-hub-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('配置文件已下载。')
  }

  const importJson = () => {
    try {
      const data = JSON.parse(json)
      importAll(data)
      setMsg('配置导入成功。')
    } catch {
      setMsg('配置导入失败：JSON 格式不正确，请检查后重试。')
    }
  }

  return (
    <div className="transfer">
      <div className="panel">
        <h3>🧘 配置迁移</h3>
        <p className="hint">
          可将全部分舵和令牌导出为 JSON，并在其他设备导入。导出内容包含 API 密钥，请勿公开或转发。
        </p>
        <div className="form-row">
          <button className="primary" onClick={exportJson}>生成导出文本</button>
          <button className="primary" onClick={download}>下载配置文件</button>
        </div>
        <textarea
          rows={10}
          className="mono"
          placeholder="导出内容将显示在这里；也可粘贴待导入的 JSON 配置"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        <div className="form-row">
          <button onClick={importJson}>导入配置</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  )
}
