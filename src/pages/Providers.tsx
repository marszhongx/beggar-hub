import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store'
import { TOKEN_TYPES, type Provider, type Token, type TokenType } from '../types'
import Table from '../components/Table'
import ProbeDetail from '../components/ProbeDetail'

export default function Providers() {
  const { t } = useTranslation()
  const providers = useStore((s) => s.providers)
  const tokenProbes = useStore((s) => s.tokenProbes)
  const addProvider = useStore((s) => s.addProvider)
  const updateProvider = useStore((s) => s.updateProvider)
  const removeProvider = useStore((s) => s.removeProvider)
  const addToken = useStore((s) => s.addToken)
  const updateToken = useStore((s) => s.updateToken)
  const removeToken = useStore((s) => s.removeToken)

  // 是否正在新增分舵行
  const [addingProvider, setAddingProvider] = useState(false)
  const [newProvider, setNewProvider] = useState({ name: '', website: '', baseUrl: '' })
  // 分舵编辑值（按 id）
  const [providerInputs, setProviderInputs] = useState<
    Record<string, { name: string; website: string; baseUrl: string; monitor: boolean }>
  >({})
  const providerVal = (s: Provider) =>
    providerInputs[s.id] ?? { name: s.name, website: s.website ?? '', baseUrl: s.baseUrl, monitor: s.monitor }

  // 轻提示（保存成功等）
  const [msg, setMsg] = useState('')
  const flash = (m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg(''), 2000)
  }

  // 某分舵是否正在新增令牌行
  const [adding, setAdding] = useState<Record<string, boolean>>({})
  // 新增行的草稿值
  const [draft, setDraft] = useState<{ type: TokenType; name: string; model: string; key: string }>({
    type: 'openai',
    name: '',
    model: '',
    key: '',
  })
  const [revealDraft, setRevealDraft] = useState(false)

  // 列表里每个令牌是否显示明文
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  // 令牌模型列的编辑值（按令牌 id）
  const [modelInputs, setModelInputs] = useState<Record<string, string>>({})
  const modelVal = (t: Token) => modelInputs[t.id] ?? t.models
  // 令牌名称列的编辑值（按令牌 id）
  const [nameInputs, setNameInputs] = useState<Record<string, string>>({})
  const nameVal = (t: Token) => nameInputs[t.id] ?? t.name
  // 令牌类型列的编辑值（按令牌 id）
  const [typeInputs, setTypeInputs] = useState<Record<string, TokenType>>({})
  const typeVal = (t: Token) => typeInputs[t.id] ?? t.type
  // 令牌密钥列的编辑值（按令牌 id）
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
  const keyVal = (t: Token) => keyInputs[t.id] ?? t.key

  const beginAddProvider = () => {
    setAddingProvider(true)
    setNewProvider({ name: '', website: '', baseUrl: '' })
  }

  const cancelAddProvider = () => {
    setAddingProvider(false)
  }

  const confirmAddProvider = () => {
    if (!newProvider.name.trim() || !newProvider.baseUrl.trim()) return
    addProvider({
      name: newProvider.name.trim(),
      baseUrl: newProvider.baseUrl.trim(),
      monitor: true,
      website: newProvider.website.trim() || undefined,
    })
    setAddingProvider(false)
  }

  const saveProvider = (s: Provider) => {
    const v = providerVal(s)
    updateProvider(s.id, {
      name: v.name.trim() || s.name,
      baseUrl: v.baseUrl.trim() || s.baseUrl,
      website: v.website.trim() || undefined,
      monitor: v.monitor,
    })
    // 清掉编辑缓存，避免残留值影响后续展示
    setProviderInputs((m) => {
      const next = { ...m }
      delete next[s.id]
      return next
    })
    flash(t('app.saved'))
  }

  const confirmRemoveProvider = (id: string) => {
    if (window.confirm(t('app.confirmDelete'))) removeProvider(id)
  }

  const confirmRemoveToken = (providerId: string, tokenId: string) => {
    if (window.confirm(t('app.confirmDelete'))) removeToken(providerId, tokenId)
  }

  const beginAdd = (providerId: string) => {
    // 同一时刻只允许一个分舵存在新增行，避免共享草稿互相污染
    setAdding({ [providerId]: true })
    setDraft({ type: 'openai', name: '', model: '', key: '' })
    setRevealDraft(false)
  }

  const cancelAdd = (providerId: string) => {
    setAdding((a) => ({ ...a, [providerId]: false }))
  }

  const confirmAdd = (providerId: string) => {
    if (!draft.name.trim() || !draft.key.trim()) return
    addToken(providerId, {
      name: draft.name.trim(),
      key: draft.key.trim(),
      type: draft.type,
      models: draft.model.trim(),
    })
    setAdding((a) => ({ ...a, [providerId]: false }))
  }

  const saveToken = (p: Provider, tok: Token) => {
    const patch: Partial<Token> = {}
    const name = nameInputs[tok.id]
    if (name !== undefined && name.trim()) patch.name = name.trim()
    const type = typeInputs[tok.id]
    if (type !== undefined) patch.type = type
    // 仅当用户真的修改过模型列时才写入，避免误点保存清空已有模型列表
    const models = modelInputs[tok.id]
    if (models !== undefined) patch.models = models.trim()
    const key = keyInputs[tok.id]
    if (key !== undefined && key.trim()) patch.key = key.trim()
    updateToken(p.id, tok.id, patch)
    // 清掉编辑缓存
    setNameInputs((m) => {
      const next = { ...m }
      delete next[tok.id]
      return next
    })
    setTypeInputs((m) => {
      const next = { ...m }
      delete next[tok.id]
      return next
    })
    setModelInputs((m) => {
      const next = { ...m }
      delete next[tok.id]
      return next
    })
    setKeyInputs((m) => {
      const next = { ...m }
      delete next[tok.id]
      return next
    })
    flash(t('app.saved'))
  }

  return (
    <div className="stations">
      {msg && <p className="msg">{msg}</p>}
      {addingProvider ? (
        <div className="panel">
          <h3>🏯 {t('providers.addTitle')}</h3>
          <div className="provider-new">
            <label className="field">
              <span>{t('providers.fieldName')}</span>
              <input
                value={newProvider.name}
                onChange={(e) => setNewProvider((n) => ({ ...n, name: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>{t('providers.fieldWebsite')}</span>
              <input
                value={newProvider.website}
                onChange={(e) => setNewProvider((n) => ({ ...n, website: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>{t('providers.fieldBaseUrl')}</span>
              <input
                value={newProvider.baseUrl}
                placeholder={t('providers.baseUrlPlaceholder')}
                onChange={(e) => setNewProvider((n) => ({ ...n, baseUrl: e.target.value }))}
              />
            </label>
            <button onClick={confirmAddProvider}>{t('providers.confirmAdd')}</button>
            <button className="danger" onClick={cancelAddProvider}>{t('app.cancel')}</button>
          </div>
          <p className="hint">{t('providers.baseUrlHint')}</p>
        </div>
      ) : (
        <button className="provider-new-card" onClick={beginAddProvider}>
          {t('providers.addCard')}
        </button>
      )}

      {providers.length === 0 ? (
        <p className="empty">{t('providers.empty')}</p>
      ) : (
        providers.map((s) => {
          const stTokens = s.tokens
          return (
            <div className="panel provider-block" key={s.id}>
              <div className="provider-head">
                <div className="provider-title">
                  <span className="provider-icon">🏯</span>
                  <span className="provider-edit">
                    <label className="field">
                      <span>{t('providers.fieldName')}</span>
                      <input
                        value={providerVal(s).name}
                        onChange={(e) =>
                          setProviderInputs((m) => ({ ...m, [s.id]: { ...providerVal(s), name: e.target.value } }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{t('providers.fieldWebsite')}</span>
                      <input
                        value={providerVal(s).website}
                        onChange={(e) =>
                          setProviderInputs((m) => ({ ...m, [s.id]: { ...providerVal(s), website: e.target.value } }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{t('providers.fieldBaseUrl')}</span>
                      <input
                        value={providerVal(s).baseUrl}
                        onChange={(e) =>
                          setProviderInputs((m) => ({ ...m, [s.id]: { ...providerVal(s), baseUrl: e.target.value } }))
                        }
                      />
                    </label>
                    <label className="field field-check">
                      <span>{t('providers.fieldMonitor')}</span>
                      <input
                        type="checkbox"
                        checked={providerVal(s).monitor}
                        onChange={(e) =>
                          setProviderInputs((m) => ({ ...m, [s.id]: { ...providerVal(s), monitor: e.target.checked } }))
                        }
                      />
                    </label>
                  </span>
                </div>
                <div className="provider-actions">
                  <button onClick={() => beginAdd(s.id)}>{t('providers.addToken')}</button>
                  <button onClick={() => saveProvider(s)}>{t('app.save')}</button>
                  <button className="danger" onClick={() => confirmRemoveProvider(s.id)}>{t('app.delete')}</button>
                </div>
              </div>

              <div className="provider-tokens">
                {stTokens.length === 0 && !adding[s.id] ? (
                  <p className="empty">{t('providers.noTokens')}</p>
                ) : (
                  <Table<Token>
                    rows={stTokens}
                    rowKey={(tok) => tok.id}
                    cols={[
                      {
                        key: 'type',
                        title: t('providers.colType'),
                        render: (tok) => (
                          <select
                            className="cell-input"
                            value={typeVal(tok)}
                            onChange={(e) =>
                              setTypeInputs((m) => ({ ...m, [tok.id]: e.target.value as TokenType }))
                            }
                          >
                            {TOKEN_TYPES.map((x) => (
                              <option key={x.value} value={x.value}>{t(x.labelKey)}</option>
                            ))}
                          </select>
                        ),
                      },
                      {
                        key: 'name',
                        title: t('providers.colTokenName'),
                        render: (tok) => (
                          <input
                            className="cell-input"
                            value={nameVal(tok)}
                            onChange={(e) =>
                              setNameInputs((m) => ({ ...m, [tok.id]: e.target.value }))
                            }
                          />
                        ),
                      },
                      {
                        key: 'models',
                        title: t('providers.colModel'),
                        render: (tok) => (
                          <input
                            className="cell-input"
                            value={modelVal(tok)}
                            onChange={(e) =>
                              setModelInputs((m) => ({ ...m, [tok.id]: e.target.value }))
                            }
                          />
                        ),
                      },
                      {
                        key: 'key',
                        title: t('providers.colKey'),
                        render: (tok) => (
                          <span className="key-input">
                            <input
                              className="cell-input"
                              type={revealed[tok.id] ? 'text' : 'password'}
                              value={keyVal(tok)}
                              onChange={(e) =>
                                setKeyInputs((k) => ({ ...k, [tok.id]: e.target.value }))
                              }
                            />
                            <button
                              className="eye"
                              type="button"
                              onClick={() => setRevealed((r) => ({ ...r, [tok.id]: !r[tok.id] }))}
                              title={revealed[tok.id] ? t('app.hideKey') : t('app.showKey')}
                            >
                              {revealed[tok.id] ? '🙈' : '👁️'}
                            </button>
                          </span>
                        ),
                      },
                      {
                        key: 'probe',
                        title: t('providers.colProbe'),
                        render: (tok) => {
                          const pr = tokenProbes[tok.id]
                          if (!pr) return <span className="status-none">⚪ {t('probe.statusNone')}</span>
                          return (
                            <div className="probe-detail">
                              <span className={pr.ok ? 'status-ok' : 'status-fail'}>
                                {pr.ok ? '🟢' : '🔴'}{' '}
                                {t('api.modelCount', {
                                  ok: pr.models.filter((m) => m.ok).length,
                                  total: pr.models.length,
                                })}
                              </span>
                              {pr.models.length > 0 && <ProbeDetail models={pr.models} />}
                            </div>
                          )
                        },
                      },
                    ]}
                    actions={(tok) => (
                      <div className="table-actions">
                        <button onClick={() => saveToken(s, tok)}>{t('app.save')}</button>
                        <button className="danger" onClick={() => confirmRemoveToken(s.id, tok.id)}>{t('app.delete')}</button>
                      </div>
                    )}
                    footerRow={() =>
                      adding[s.id] ? (
                        <tr className="row-new">
                          <td>
                            <select
                              value={draft.type}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, type: e.target.value as TokenType }))
                              }
                            >
                              {TOKEN_TYPES.map((x) => (
                                <option key={x.value} value={x.value}>{t(x.labelKey)}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              className="cell-input"
                              value={draft.name}
                              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              className="cell-input"
                              value={draft.model}
                              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                            />
                          </td>
                          <td className="key-cell">
                            <span className="key-input">
                              <input
                                className="cell-input"
                                type={revealDraft ? 'text' : 'password'}
                                value={draft.key}
                                onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                              />
                              <button
                                className="eye"
                                type="button"
                                onClick={() => setRevealDraft((r) => !r)}
                                title={revealDraft ? t('app.hideKey') : t('app.showKey')}
                              >
                                {revealDraft ? '🙈' : '👁️'}
                              </button>
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button onClick={() => confirmAdd(s.id)}>{t('app.save')}</button>
                              <button className="danger" onClick={() => cancelAdd(s.id)}>{t('app.cancel')}</button>
                            </div>
                          </td>
                        </tr>
                      ) : null
                    }
                  />
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
