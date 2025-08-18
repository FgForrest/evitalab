import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class RemoveAssociatedDataSchemaMutation extends EntitySchemaMutation {
    readonly kind: string = 'removeAssociatedDataSchemaMutation'
    readonly name: string

    constructor(name: string) {
        super()

        this.name = name
    }
}
