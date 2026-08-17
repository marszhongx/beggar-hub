// 丐帮探子 —— 用令牌（API Key）实测对话接口连通性
// 参考 yunwu 的 Provider 实现：类型决定 API 格式，baseUrl 自动归一化

import type { ModelProbeResult, ProbeResult, TokenType } from './types'
import i18n from './i18n'

const t = i18n.t.bind(i18n)

/** 单次探测超时时间（毫秒），避免请求挂起卡死「探中」状态 */
const REQUEST_TIMEOUT_MS = 30_000

/** 推理模型：chat/completions 需用 max_completion_tokens，否则 400 */
const REASONING_MODEL_RE = /^(o\d|gpt-5(?:\.|$))/i

/** 错误详情展示的最大长度 */
const DETAIL_MAX_LEN = 120

/** 统计一次探测将要请求的模型数量（与 probe 的拆分逻辑保持一致） */
export function countProbeModels(models: string): number {
  const list = models
    .split(/[,，\s]+/)
    .map((m) => m.trim())
    .filter(Boolean)
  return list.length > 0 ? list.length : 1
}

/** 归一化 baseUrl：去尾部斜杠，OpenAI 兼容自动补 /v1。
 *  以 / 结尾表示用户已给出完整接口前缀（去掉末尾斜杠后不再自动补 /v1）。 */
function normalizeBaseUrl(baseUrl: string): string {
  const raw = baseUrl.trim() || 'https://api.openai.com/v1'
  if (raw.endsWith('/')) return raw.replace(/\/+$/, '')
  const url = raw.replace(/\/+$/, '')
  // 若用户填的是根域名（无 /v1），自动补上
  return /\/v\d+$/.test(url) ? url : `${url}/v1`
}

function isReasoningModel(model: string): boolean {
  return REASONING_MODEL_RE.test(model)
}

/** 从响应体提取错误详情，供提示信息使用。
 *  仅 error 字段视为失败详情；成功响应里的顶层 message（如 {"message":"success"}）不算错误，
 *  避免网关正常返回 200 却被误判为失败。非 2xx 且无 error 时才回退读顶层 message（兼容部分网关）。 */
async function readErrorDetail(res: Response): Promise<string> {
  try {
    const text = await res.text()
    if (!text) return ''
    const data = JSON.parse(text)
    const err = data?.error
    let msg = ''
    if (typeof err === 'string') msg = err
    else if (err && typeof err === 'object') {
      msg = typeof err.message === 'string' ? err.message : JSON.stringify(err)
    }
    if (!msg && !res.ok && typeof data?.message === 'string') msg = data.message
    if (!msg) return ''
    return msg.length > DETAIL_MAX_LEN ? `${msg.slice(0, DETAIL_MAX_LEN)}…` : msg
  } catch {
    return ''
  }
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
  const chatModel = model || 'gpt-3.5-turbo'
  return {
    url: `${url}/chat/completions`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chatModel,
        messages: [{ role: 'user', content: 'hi' }],
        // 推理模型不接受 max_tokens，需改用 max_completion_tokens
        ...(isReasoningModel(chatModel) ? { max_completion_tokens: 16 } : { max_tokens: 1 }),
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
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const start = Date.now()
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const latencyMs = Date.now() - start
    const detail = await readErrorDetail(res)
    // 部分网关即使失败也返回 200，仅在响应体确无错误时才算成功
    if (res.ok && !detail) {
      return { ok: true, latencyMs, message: t('api.ok') }
    }
    const detailSuffix = detail ? ` ${detail}` : ''
    if (res.status === 401 || res.status === 403) {
      return { ok: false, latencyMs, message: t('api.keyInvalid', { status: res.status, detail: detailSuffix }) }
    }
    if (res.status === 404) {
      return { ok: false, latencyMs, message: t('api.notFound', { detail: detailSuffix }) }
    }
    return { ok: false, latencyMs, message: t('api.requestFailed', { status: res.status, detail: detailSuffix }) }
  } catch (e) {
    const latencyMs = Date.now() - start
    const aborted = e instanceof DOMException && e.name === 'AbortError'
    return {
      ok: false,
      latencyMs,
      message: aborted ? t('api.timeout') : t('api.networkError'),
    }
  } finally {
    clearTimeout(timer)
  }
}

/** 探子探报 —— 用 API Key 按令牌类型实测对话接口，有多个模型则逐个查 */
export async function probe(
  baseUrl: string,
  apiKey: string,
  type: TokenType,
  models: string,
  onProgress?: (done: number, total: number) => void
): Promise<ProbeResult> {
  const list = models
    .split(/[,，\s]+/)
    .map((m) => m.trim())
    .filter(Boolean)
  const list2 = list.length > 0 ? list : ['']
  const total = list2.length
  // 并发探测，每完成一个即上报进度
  let done = 0
  const results = await Promise.all(
    list2.map(async (m) => {
      const r = await testOne(baseUrl, apiKey, type, m)
      done++
      onProgress?.(done, total)
      return r
    })
  )
  const okAll = results.every((r) => r.ok)
  const maxLatency = results.length > 0 ? Math.max(...results.map((r) => r.latencyMs)) : 0
  const modelResults: ModelProbeResult[] = list2.map((m, i) => ({
    model: m || t('api.defaultModel'),
    ok: results[i].ok,
    message: results[i].message,
  }))

  return { ok: okAll, latencyMs: Math.round(maxLatency), probedAt: Date.now(), models: modelResults }
}