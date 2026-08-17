import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProbeResult, Provider, Token } from './types'

interface AppState {
  providers: Provider[]
  /** 各令牌最近一次探报（tokenId → 结果） */
  tokenProbes: Record<string, ProbeResult>
  /** 各分舵最近探报历史（providerId → 结果列表） */
  probeHistory: Record<string, ProbeResult[]>

  addProvider: (p: Omit<Provider, 'id' | 'createdAt' | 'tokens'>) => void
  updateProvider: (id: string, patch: Partial<Provider>) => void
  removeProvider: (id: string) => void

  addToken: (providerId: string, t: Omit<Token, 'id' | 'createdAt'>) => void
  updateToken: (providerId: string, tokenId: string, patch: Partial<Token>) => void
  removeToken: (providerId: string, tokenId: string) => void

  setTokenProbe: (tokenId: string, result: ProbeResult) => void
  pushProbeHistory: (providerId: string, result: ProbeResult) => void

  importAll: (data: Partial<AppState>) => void
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

/** 校验导入数据的基本结构，防止结构错误但可解析的 JSON 撑爆应用 */
export function isValidImportData(data: unknown): data is Partial<AppState> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const d = data as Record<string, unknown>
  if (d.providers !== undefined && !Array.isArray(d.providers)) return false
  const providers = d.providers as Record<string, unknown>[] | undefined
  if (providers) {
    for (const p of providers) {
      if (!p || typeof p !== 'object') return false
      const pp = p as Record<string, unknown>
      if (
        typeof pp.id !== 'string' ||
        typeof pp.name !== 'string' ||
        typeof pp.baseUrl !== 'string' ||
        typeof pp.monitor !== 'boolean' ||
        !Array.isArray(pp.tokens)
      ) {
        return false
      }
      for (const tok of pp.tokens) {
        if (!tok || typeof tok !== 'object') return false
        const tt = tok as Record<string, unknown>
        if (
          typeof tt.id !== 'string' ||
          typeof tt.name !== 'string' ||
          typeof tt.key !== 'string' ||
          typeof tt.models !== 'string'
        ) {
          return false
        }
        if (tt.type !== 'openai' && tt.type !== 'openai-response') return false
      }
    }
  }
  return true
}

/** 只保留指定 key 集合内的条目 */
function pruneByKeys<T>(map: Record<string, T>, keep: Set<string>): Record<string, T> {
  const out: Record<string, T> = {}
  for (const k of Object.keys(map)) {
    if (keep.has(k)) out[k] = map[k]
  }
  return out
}

/** 删除单个 key（不存在时返回原对象，避免无谓拷贝） */
function omitKey<T>(map: Record<string, T>, key: string): Record<string, T> {
  if (!(key in map)) return map
  const out = { ...map }
  delete out[key]
  return out
}

/** 持久化旧数据 / 被污染 storage 的兜底：只取合法字段 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      providers: [],
      tokenProbes: {},
      probeHistory: {},

      addProvider: (p) =>
        set((st) => ({
          providers: [
            ...st.providers,
            { ...p, id: uid(), createdAt: Date.now(), tokens: [] },
          ],
        })),
      updateProvider: (id, patch) =>
        set((st) => ({
          providers: st.providers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeProvider: (id) =>
        set((st) => {
          // 同步清理该分舵及其令牌的探报，避免孤儿数据残留
          const tokenIds = new Set((st.providers.find((x) => x.id === id)?.tokens ?? []).map((x) => x.id))
          const tokenProbes = { ...st.tokenProbes }
          for (const tid of tokenIds) delete tokenProbes[tid]
          return {
            providers: st.providers.filter((x) => x.id !== id),
            tokenProbes,
            probeHistory: omitKey(st.probeHistory, id),
          }
        }),

      addToken: (providerId, t) =>
        set((st) => ({
          providers: st.providers.map((p) =>
            p.id === providerId
              ? { ...p, tokens: [...p.tokens, { ...t, id: uid(), createdAt: Date.now() }] }
              : p
          ),
        })),
      updateToken: (providerId, tokenId, patch) =>
        set((st) => ({
          providers: st.providers.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  tokens: p.tokens.map((t) => (t.id === tokenId ? { ...t, ...patch } : t)),
                }
              : p
          ),
        })),
      removeToken: (providerId, tokenId) =>
        set((st) => ({
          providers: st.providers.map((p) =>
            p.id === providerId
              ? { ...p, tokens: p.tokens.filter((t) => t.id !== tokenId) }
              : p
          ),
          tokenProbes: omitKey(st.tokenProbes, tokenId),
        })),

      setTokenProbe: (tokenId, result) =>
        set((st) => ({ tokenProbes: { ...st.tokenProbes, [tokenId]: result } })),

      pushProbeHistory: (providerId, result) =>
        set((st) => ({
          probeHistory: {
            ...st.probeHistory,
            [providerId]: [...(st.probeHistory[providerId] ?? []), result].slice(-10),
          },
        })),

      importAll: (data) =>
        set((st) => {
          const providers = data.providers ?? st.providers
          const tokenIds = new Set(providers.flatMap((p) => p.tokens.map((x) => x.id)))
          const providerIds = new Set(providers.map((p) => p.id))
          return {
            providers,
            // 导入后清理指向已不存在分舵/令牌的探报，避免展示过期状态
            tokenProbes: pruneByKeys(data.tokenProbes ?? st.tokenProbes, tokenIds),
            probeHistory: pruneByKeys(data.probeHistory ?? st.probeHistory, providerIds),
          }
        }),
    }),
    {
      name: 'beggar-hub-store',
      version: 1,
      // 迁移旧版本/被污染的 localStorage：仅保留合法字段，其余回退默认值
      migrate: (persistedState) => {
        const raw = isRecord(persistedState) ? persistedState : {}
        return {
          providers: Array.isArray(raw.providers) ? raw.providers : [],
          tokenProbes: isRecord(raw.tokenProbes) ? raw.tokenProbes : {},
          probeHistory: isRecord(raw.probeHistory) ? raw.probeHistory : {},
        } as unknown as AppState
      },
    }
  )
)