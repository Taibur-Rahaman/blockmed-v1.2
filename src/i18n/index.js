import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import translations from './translations'

// Initialize i18n with error handling
try {
  const translationResources = {
    en: { translation: translations?.en || {} },
    bn: { translation: translations?.bn || {} },
  }

  i18n
    .use(initReactI18next)
    .init({
      resources: translationResources,
      lng: (typeof localStorage !== 'undefined' && localStorage.getItem('blockmed-language')) || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    })
    .catch((error) => {
      console.error('i18n initialization promise error:', error)
      // Fallback initialization
      i18n
        .use(initReactI18next)
        .init({
          resources: {
            en: { translation: {} },
            bn: { translation: {} },
          },
          lng: 'en',
          fallbackLng: 'en',
          interpolation: {
            escapeValue: false,
          },
          react: {
            useSuspense: false,
          },
        })
    })
} catch (error) {
  console.error('Failed to initialize i18n:', error)
  // Initialize with empty translations as fallback
  try {
    i18n
      .use(initReactI18next)
      .init({
        resources: {
          en: { translation: {} },
          bn: { translation: {} },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      })
  } catch (fallbackError) {
    console.error('Failed to initialize i18n fallback:', fallbackError)
  }
}

export default i18n

