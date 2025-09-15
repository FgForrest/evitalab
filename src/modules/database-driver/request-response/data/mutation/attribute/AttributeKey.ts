import type { Locale } from '@/modules/database-driver/data-type/Locale.ts'

export class AttributeKey {
    readonly attributeName: string
    readonly locale: Locale|undefined

    constructor(attributeName: string, locale?: Locale) {
        this.attributeName = attributeName
        this.locale = locale
    }
}
