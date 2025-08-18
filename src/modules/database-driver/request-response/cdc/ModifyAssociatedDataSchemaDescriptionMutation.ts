import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class ModifyAssociatedDataSchemaDescriptionMutation  extends EntitySchemaMutation {
    readonly kind: string = 'modifyAssociatedDataSchemaDescriptionMutation'
    readonly name: string
    readonly description?: string

    constructor(name: string, description?: string) {
        super()
        this.name = name;
        this.description = description;
    }
}
