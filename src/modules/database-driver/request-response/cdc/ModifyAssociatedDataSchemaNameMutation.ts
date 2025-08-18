import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class ModifyAssociatedDataSchemaNameMutation extends EntitySchemaMutation {
    readonly kind: string = 'modifyAssociatedDataSchemaNameMutation'
    readonly name: string
    readonly description: string

    constructor(name: string, description: string) {
        super()
        this.name = name;
        this.description = description;
    }
}
