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
    setMsg('已导出，复制下方内容保存')
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `beggar-hub-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('已下载配置文件')
  }

  const importJson = () => {
    try {
      const data = JSON.parse(json)
      importAll(data)
      setMsg('传功成功！配置已导入')
    } catch (e) {
      setMsg('传功失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <div className="transfer">
      <div className="panel">
        <h3>🧘 传功（配置导入导出）</h3>
        <p className="hint">
          导出当前全部分舵与令牌配置为 JSON，可在其他设备导入。密钥会一并导出，请妥善保管。
        </p>
        <div className="form-row">
          <button className="primary" onClick={exportJson}>导出到文本框</button>
          <button className="primary" onClick={download}>下载 JSON 文件</button>
        </div>
        <textarea
          rows={10}
          className="mono"
          placeholder="导出的配置会显示在这里，或粘贴要导入的配置"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        <div className="form-row">
          <button onClick={importJson}>导入（传功）</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  )
}
