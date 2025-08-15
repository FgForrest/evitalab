import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class AllowLocaleInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'allowLocaleInEntitySchemaMutation'
    readonly locales: string[]

    constructor(locales: string[]) {
        super()
        this.locales = locales
    }
}
