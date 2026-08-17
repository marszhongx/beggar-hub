import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** 仅生产构建注入 CSP。
 *  开发模式 Vite 会向 index.html 注入 react-refresh 内联脚本，加限制会打断热更新。 */
const cspPlugin: Plugin = {
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml() {
    return [
      {
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            // 探子请求直接打到用户填的任意 API 地址，需放开 connect-src
            "connect-src *",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        injectTo: 'head-prepend',
      },
    ]
  },
}

export default defineConfig({
  plugins: [react(), cspPlugin],
  base: './',
})