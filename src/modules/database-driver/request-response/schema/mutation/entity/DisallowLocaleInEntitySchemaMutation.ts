import { Set as ImmutableSet } from 'immutable'
import type { Locale } from '@/modules/database-driver/data-type/Locale.ts'

export class DisallowLocaleInEntitySchemaMutation {
    readonly locales: ImmutableSet<Locale>

    constructor(locales: ImmutableSet<Locale>) {
        this.locales = locales
    }
}
