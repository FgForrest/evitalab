import { Locale } from '@/modules/connection/model/data-type/Locale'

// todo docs
export class AssociatedDataValue {
    readonly locale: Locale | undefined
    readonly name: string
    readonly value: any

    constructor(locale: Locale | undefined, name: string, value: any) {
        this.locale = locale
        this.name = name
        this.value = value
    }
}
