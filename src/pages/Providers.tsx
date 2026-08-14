import { useState } from 'react'
import { useStore } from '../store'
import { TOKEN_TYPES, type Provider, type Token, type TokenType } from '../types'
import Table from '../components/Table'

export default function Providers() {
  const providers = useStore((s) => s.providers)
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
  const [providerInputs, setProviderInputs] = useState<Record<string, { name: string; website: string; baseUrl: string }>>({})
  const providerVal = (s: Provider) => providerInputs[s.id] ?? { name: s.name, website: s.website ?? '', baseUrl: s.baseUrl }

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
  const modelVal = (t: Token) => modelInputs[t.id] ?? t.models.join(', ')
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
    })
  }

  const beginAdd = (providerId: string) => {
    setAdding((a) => ({ ...a, [providerId]: true }))
    setDraft({ type: 'openai', name: '', model: '', key: '' })
    setRevealDraft(false)
  }

  const cancelAdd = (providerId: string) => {
    setAdding((a) => ({ ...a, [providerId]: false }))
  }

  const confirmAdd = (providerId: string) => {
    if (!draft.name.trim() || !draft.key.trim()) return
    const models = draft.model
      .split(/[,，\s]+/)
      .map((m) => m.trim())
      .filter(Boolean)
    addToken(providerId, {
      name: draft.name.trim(),
      key: draft.key.trim(),
      type: draft.type,
      models,
    })
    setAdding((a) => ({ ...a, [providerId]: false }))
  }

  const saveToken = (p: Provider, t: Token) => {
    const patch: Partial<Token> = {}
    const models = (modelInputs[t.id] ?? '')
      .split(/[,，\s]+/)
      .map((m) => m.trim())
      .filter(Boolean)
    patch.models = models
    const key = keyInputs[t.id]
    if (key !== undefined && key.trim()) patch.key = key.trim()
    updateToken(p.id, t.id, patch)
  }

  return (
    <div className="stations">
      {addingProvider ? (
        <div className="panel">
          <h3>🏯 登记公益站</h3>
          <div className="provider-new">
            <input
              placeholder="公益站名称（必填）"
              value={newProvider.name}
              onChange={(e) => setNewProvider((n) => ({ ...n, name: e.target.value }))}
            />
            <input
              placeholder="官网地址（可选）"
              value={newProvider.website}
              onChange={(e) => setNewProvider((n) => ({ ...n, website: e.target.value }))}
            />
            <input
              placeholder="API 基础地址（必填）"
              value={newProvider.baseUrl}
              onChange={(e) => setNewProvider((n) => ({ ...n, baseUrl: e.target.value }))}
            />
            <button onClick={confirmAddProvider}>确认登记</button>
            <button className="danger" onClick={cancelAddProvider}>取消</button>
          </div>
        </div>
      ) : (
        <button className="provider-new-card" onClick={beginAddProvider}>
          ＋ 登记公益站
        </button>
      )}

      {providers.length === 0 ? (
        <p className="empty">尚未登记公益站。点击上方按钮开始添加。</p>
      ) : (
        providers.map((s) => {
          const stTokens = s.tokens
          return (
            <div className="panel provider-block" key={s.id}>
              <div className="provider-head">
                <div className="provider-title">
                  <span className="provider-icon">🏯</span>
                  <span className="provider-edit">
                    <input
                      value={providerVal(s).name}
                      onChange={(e) =>
                        setProviderInputs((m) => ({ ...m, [s.id]: { ...providerVal(s), name: e.target.value } }))
                      }
                    />
                    <input
                      value={providerVal(s).website}
                      placeholder="官网地址（可选）"
                      onChange={(e) =>
                        setProviderInputs((m) => ({ ...m, [s.id]: { ...providerVal(s), website: e.target.value } }))
                      }
                    />
                    <input
                      value={providerVal(s).baseUrl}
                      placeholder="API 基础地址"
                      onChange={(e) =>
                        setProviderInputs((m) => ({ ...m, [s.id]: { ...providerVal(s), baseUrl: e.target.value } }))
                      }
                    />
                  </span>
                </div>
                <div className="provider-actions">
                  <button onClick={() => beginAdd(s.id)}>添加令牌</button>
                  <button onClick={() => saveProvider(s)}>保存修改</button>
                  <button className="danger" onClick={() => removeProvider(s.id)}>删除分舵</button>
                </div>
              </div>

              <div className="provider-tokens">
                {stTokens.length === 0 && !adding[s.id] ? (
                  <p className="empty">尚未添加令牌。添加后即可检测接口连通性。</p>
                ) : (
                  <Table<Token>
                    rows={stTokens}
                    rowKey={(t) => t.id}
                    cols={[
                      {
                        key: 'type',
                        title: '类型',
                        render: (t) => TOKEN_TYPES.find((x) => x.value === t.type)?.label ?? t.type,
                      },
                      { key: 'name', title: '令牌名称' },
                      {
                        key: 'models',
                        title: '模型',
                        render: (t) => (
                          <input
                            className="cell-input"
                            value={modelVal(t)}
                            placeholder="模型名称，多个请用逗号分隔"
                            onChange={(e) =>
                              setModelInputs((m) => ({ ...m, [t.id]: e.target.value }))
                            }
                          />
                        ),
                      },
                      {
                        key: 'key',
                        title: 'API 密钥',
                        render: (t) => (
                          <span className="key-input">
                            <input
                              className="cell-input"
                              type={revealed[t.id] ? 'text' : 'password'}
                              value={keyVal(t)}
                              placeholder="API Key"
                              onChange={(e) =>
                                setKeyInputs((k) => ({ ...k, [t.id]: e.target.value }))
                              }
                            />
                            <button
                              className="eye"
                              type="button"
                              onClick={() => setRevealed((r) => ({ ...r, [t.id]: !r[t.id] }))}
                              title={revealed[t.id] ? '隐藏密钥' : '显示密钥'}
                            >
                              {revealed[t.id] ? '🙈' : '👁️'}
                            </button>
                          </span>
                        ),
                      },
                    ]}
                    actions={(t) => (
                      <div className="table-actions">
                        <button onClick={() => saveToken(s, t)}>保存修改</button>
                        <button className="danger" onClick={() => removeToken(s.id, t.id)}>删除</button>
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
                                <option key={x.value} value={x.value}>{x.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              className="cell-input"
                              placeholder="令牌名称（必填）"
                              value={draft.name}
                              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              className="cell-input"
                              placeholder="模型名称，多个请用逗号分隔"
                              value={draft.model}
                              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                            />
                          </td>
                          <td className="key-cell">
                            <span className="key-input">
                              <input
                                className="cell-input"
                                type={revealDraft ? 'text' : 'password'}
                                placeholder="API 密钥（必填）"
                                value={draft.key}
                                onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                              />
                              <button
                                className="eye"
                                type="button"
                                onClick={() => setRevealDraft((r) => !r)}
                                title={revealDraft ? '隐藏密钥' : '显示密钥'}
                              >
                                {revealDraft ? '🙈' : '👁️'}
                              </button>
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button onClick={() => confirmAdd(s.id)}>确认添加</button>
                              <button className="danger" onClick={() => cancelAdd(s.id)}>取消</button>
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
