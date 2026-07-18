import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import { Locale } from '@/modules/database-driver/data-type/Locale'

/**
 * Associated data holder is used internally to keep track of associated data as well as its unique identification that
 * is assigned new everytime associated data changes somehow.
 */
export class AssociatedDataValue {
    readonly locale: Locale | undefined
    readonly name: string
    readonly value: EvitaValue

    constructor(locale: Locale | undefined, name: string, value: EvitaValue) {
        this.locale = locale
        this.name = name
        this.value = value
    }
}
