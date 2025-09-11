import { Set as ImmutableSet } from 'immutable'
import type { Locale } from 'vue-i18n'

export class DisallowLocaleInEntity {
    readonly locales: ImmutableSet<Locale>

    constructor(locales: ImmutableSet<Locale>) {
        this.locales = locales
    }
}
