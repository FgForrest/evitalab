import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class ModifyAssociatedDataSchemaTypeMutation extends EntitySchemaMutation {
    readonly kind: string = 'modifyAssociatedDataSchemaTypeMutation'
    readonly name: string
    readonly type: any

    constructor(name: string, type: any) {
        super()
        this.name = name
        this.type = type
    }
}
