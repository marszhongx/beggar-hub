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
        set((st) => ({
          providers: st.providers.filter((x) => x.id !== id),
        })),

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
        set((st) => ({
          providers: data.providers ?? st.providers,
          tokenProbes: data.tokenProbes ?? st.tokenProbes,
          probeHistory: data.probeHistory ?? st.probeHistory,
        })),
    }),
    { name: 'beggar-hub-store' }
  )
)
