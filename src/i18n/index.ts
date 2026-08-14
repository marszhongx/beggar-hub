import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh'
import en from './locales/en'

export const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
