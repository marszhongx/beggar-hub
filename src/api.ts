// 丐帮探子 —— 用令牌（API Key）实测对话接口连通性
// 参考 yunwu 的 Provider 实现：类型决定 API 格式，baseUrl 自动归一化

import type { ProbeResult, TokenType } from './types'
import i18n from './i18n'

const t = i18n.t.bind(i18n)

/** 归一化 baseUrl：去尾部斜杠，OpenAI 兼容自动补 /v1 */
function normalizeBaseUrl(baseUrl: string): string {
  const url = (baseUrl.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '')
  // 若用户填的是根域名（无 /v1），自动补上
  return /\/v\d+$/.test(url) ? url : `${url}/v1`
}

/** 按类型构造对话请求 */
function buildRequest(
  type: TokenType,
  baseUrl: string,
  apiKey: string,
  model: string
): { url: string; init: RequestInit } {
  const url = normalizeBaseUrl(baseUrl)

  if (type === 'openai-response') {
    return {
      url: `${url}/responses`,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          input: 'hi',
          max_output_tokens: 1,
        }),
      },
    }
  }

  // openai 走 OpenAI 兼容的 chat/completions
  return {
    url: `${url}/chat/completions`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
    },
  }
}

/** 对单个模型发一次最小对话测试 */
async function testOne(
  baseUrl: string,
  apiKey: string,
  type: TokenType,
  model: string
): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const { url, init } = buildRequest(type, baseUrl, apiKey, model)
  const start = Date.now()
  try {
    const res = await fetch(url, init)
    const latencyMs = Date.now() - start
    if (res.ok) {
      return { ok: true, latencyMs, message: t('api.ok') }
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, latencyMs, message: t('api.keyInvalid', { status: res.status }) }
    }
    if (res.status === 404) {
      return { ok: false, latencyMs, message: t('api.notFound') }
    }
    return { ok: false, latencyMs, message: t('api.requestFailed', { status: res.status }) }
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      message: t('api.networkError'),
    }
  }
}

/** 探子探报 —— 用 API Key 按令牌类型实测对话接口，有多个模型则逐个查 */
export async function probe(
  baseUrl: string,
  apiKey: string,
  type: TokenType,
  models: string
): Promise<ProbeResult> {
  const list = models
    .split(/[,，\s]+/)
    .map((m) => m.trim())
    .filter(Boolean)
  const list2 = list.length > 0 ? list : ['']
  const results = await Promise.all(list2.map((m) => testOne(baseUrl, apiKey, type, m)))
  const okAll = results.every((r) => r.ok)
  const okCount = results.filter((r) => r.ok).length
  const maxLatency = Math.max(...results.map((r) => r.latencyMs))

  const label = (i: number) => (list.length > 0 ? t('api.modelLabel', { name: list2[i] }) : t('api.defaultModel'))

  let message: string
  if (okAll) {
    message =
      list.length > 0
        ? t('api.keyValidAll', { count: results.length })
        : t('api.keyValidDefault')
  } else {
    const fail = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => !result.ok)
      .map(({ result, index }) => `${label(index)}：${result.message}`)
      .join('；')
    message =
      list.length > 0
        ? t('api.partial', { ok: okCount, total: results.length, fail })
        : t('api.defaultFail', { fail })
  }

  return { ok: okAll, latencyMs: Math.round(maxLatency), message, probedAt: Date.now() }
}
