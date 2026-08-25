import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ar from './ar.json'

export type AppLanguage = 'en' | 'ar'

const STORAGE_KEY = 'retailkey-pos-language'

function readSavedLanguage(): AppLanguage {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'ar' ? 'ar' : 'en'
}

function applyDirection(lang: AppLanguage): void {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

const initialLanguage = readSavedLanguage()
applyDirection(initialLanguage)

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export function setLanguage(lang: AppLanguage): void {
  void i18n.changeLanguage(lang)
  localStorage.setItem(STORAGE_KEY, lang)
  applyDirection(lang)
}

export function getLanguage(): AppLanguage {
  return i18n.language === 'ar' ? 'ar' : 'en'
}

export default i18n
