import type { Locale } from '@/modules/database-driver/data-type/Locale.ts'

export class AssociatedDataKey {
    readonly associatedDataName: string
    readonly locale: Locale|undefined

    constructor(associatedDataName: string, locale?: Locale) {
        this.associatedDataName = associatedDataName
        this.locale = locale
    }
}
