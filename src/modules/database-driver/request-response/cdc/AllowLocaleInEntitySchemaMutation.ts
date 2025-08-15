import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import { List as ImmutableList } from 'immutable'

export class AllowLocaleInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'allowLocaleInEntitySchemaMutation'
    readonly locales: ImmutableList<string>

    constructor(locales: ImmutableList<string>) {
        super()
        this.locales = locales
    }
}
