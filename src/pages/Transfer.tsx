import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'

export default function Transfer() {
  const { t } = useTranslation()
  const importAll = useStore((s) => s.importAll)
  const providers = useStore((s) => s.providers)
  const state = { providers }
  const [json, setJson] = useState('')
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const data = JSON.stringify(state, null, 2)
    setJson(data)
    setMsg(t('transfer.exported'))
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `beggar-hub-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg(t('transfer.downloaded'))
  }

  const importJson = () => {
    try {
      const data = JSON.parse(json)
      importAll(data)
      setMsg(t('transfer.success'))
    } catch {
      setMsg(t('transfer.fail'))
    }
  }

  return (
    <div className="transfer">
      <div className="panel">
        <h3>🧘 {t('transfer.title')}</h3>
        <p className="hint">
          {t('transfer.hint')}
        </p>
        <div className="form-row">
          <button className="primary" onClick={exportJson}>{t('transfer.exportText')}</button>
          <button className="primary" onClick={download}>{t('transfer.download')}</button>
        </div>
        <textarea
          rows={10}
          className="mono"
          placeholder={t('transfer.textareaPlaceholder')}
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        <div className="form-row">
          <button onClick={importJson}>{t('transfer.import')}</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  )
}
