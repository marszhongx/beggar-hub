// 丐帮探子 —— 用令牌（API Key）实测对话接口连通性
// 参考 yunwu 的 Provider 实现：类型决定 API 格式，baseUrl 自动归一化

import type { ProbeResult, TokenType } from './types'

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
      return { ok: true, latencyMs, message: '接口可用' }
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, latencyMs, message: `API 密钥无效或无访问权限（HTTP ${res.status}）` }
    }
    if (res.status === 404) {
      return { ok: false, latencyMs, message: '未找到对应的对话接口（HTTP 404）' }
    }
    return { ok: false, latencyMs, message: `请求失败（HTTP ${res.status}）` }
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      message: '网络请求失败，请检查接口地址、网络连接或 CORS 配置',
    }
  }
}

/** 探子探报 —— 用 API Key 按令牌类型实测对话接口，有多个模型则逐个查 */
export async function probe(
  baseUrl: string,
  apiKey: string,
  type: TokenType,
  models: string[]
): Promise<ProbeResult> {
  const list = models.length > 0 ? models : ['']
  const results = await Promise.all(list.map((m) => testOne(baseUrl, apiKey, type, m)))
  const okAll = results.every((r) => r.ok)
  const okCount = results.filter((r) => r.ok).length
  const maxLatency = Math.max(...results.map((r) => r.latencyMs))

  const label = (i: number) => (models.length > 0 ? `模型 ${list[i]}` : '默认模型')

  let message: string
  if (okAll) {
    message =
      models.length > 0
        ? `API 密钥有效，${results.length} 个模型均可访问`
        : 'API 密钥有效，接口可正常访问'
  } else {
    const fail = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => !result.ok)
      .map(({ result, index }) => `${label(index)}：${result.message}`)
      .join('；')
    message =
      models.length > 0
        ? `${okCount}/${results.length} 个模型可访问：${fail}`
        : `默认模型不可访问：${fail}`
  }

  return { ok: okAll, latencyMs: Math.round(maxLatency), message, probedAt: Date.now() }
}
