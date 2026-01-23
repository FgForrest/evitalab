import { Locale } from '@/modules/database-driver/data-type/Locale'

/**
 * Represents single attribute og the {@link Entity}. AttributeValue serves as wrapper for the attribute value
 * that also carries current version of the value for the sake of optimistic locking and the locale (in case attribute
 * is localized).
 */
export class AttributeValue {
    readonly locale: Locale | undefined
    readonly name: string
    readonly value: unknown

    constructor(locale: Locale | undefined, name: string, value: unknown) {
        this.locale = locale
        this.name = name
        this.value = value
    }
}
