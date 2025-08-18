import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class SetAssociatedDataSchemaLocalizedMutation extends EntitySchemaMutation{
    readonly kind: string = 'setAssociatedDataSchemaLocalizedMutation'
    readonly name: string
    readonly localized: boolean


    constructor(name: string, localized: boolean) {
        super()
        this.name = name
        this.localized = localized
    }
}
