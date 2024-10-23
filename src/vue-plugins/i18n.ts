import { createI18n } from 'vue-i18n'
import en from '@/modules/i18n/en.json'

/**
 * Lists all supported locales by evitaLab
 */
export enum SupportedLocale {
    En = 'en'
}

type MessageSchema = typeof en

/**
 * Builds i18n instance from passed messages
 */
export const i18n = createI18n<[MessageSchema], SupportedLocale.En>({
    legacy: false, // composition API
    locale: SupportedLocale.En,
    fallbackLocale: SupportedLocale.En,
    messages: {
        en
    }
})
