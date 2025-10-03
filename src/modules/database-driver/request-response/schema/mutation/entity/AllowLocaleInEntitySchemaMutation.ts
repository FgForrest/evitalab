import { List as ImmutableList } from 'immutable'
import type { Locale } from '@/modules/database-driver/data-type/Locale.ts'

export class AllowLocaleInEntitySchemaMutation {
    readonly locales: ImmutableList<Locale>

    constructor(locales: ImmutableList<Locale>) {
        this.locales = locales
    }
}
