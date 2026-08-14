// 丐帮核心类型定义

/** 探子探报结果 */
export interface ProbeResult {
  ok: boolean
  latencyMs: number
  message: string
  probedAt: number
}

/** 令牌类型（决定探子用哪个对话接口测试） */
export type TokenType = 'openai' | 'openai-response'

export const TOKEN_TYPES: { value: TokenType; labelKey: string }[] = [
  { value: 'openai', labelKey: 'tokenTypes.openai' },
  { value: 'openai-response', labelKey: 'tokenTypes.openaiResponse' },
]

/** 令牌 —— 分舵（Provider）里的一个 API Key */
export interface Token {
  id: string
  name: string
  key: string
  /** 令牌类型 */
  type: TokenType
  /** 模型名（探子测试用，逗号分隔） */
  models: string
  /** 备注 */
  note?: string
  createdAt: number
}

/** Provider（分舵） */
export interface Provider {
  id: string
  name: string
  /** API 接口地址 */
  baseUrl: string
  /** 官网地址（可选） */
  website?: string
  /** 是否启用探子监控 */
  monitor: boolean
  /** 探子最近一次探报 */
  lastProbe?: ProbeResult
  /** 该 Provider 下的令牌 */
  tokens: Token[]
  createdAt: number
}
