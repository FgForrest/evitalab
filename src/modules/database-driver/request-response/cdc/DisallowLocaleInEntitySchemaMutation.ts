import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class DisallowLocaleInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'disallowLocaleInEntitySchemaMutation'
    readonly locales: string[]

    constructor(locales: string[]) {
        super()
        this.locales = locales
    }
}
