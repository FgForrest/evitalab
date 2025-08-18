import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class ModifyAssociatedDataSchemaDeprecationNoticeMutation extends EntitySchemaMutation {
    readonly kind: string = 'modifyAssociatedDataSchemaDescriptionMutation'
    readonly name: string
    readonly deprecationNotice?: string

    constructor(name: string, deprecationNotice?: string) {
        super()
        this.name = name;
        this.deprecationNotice = deprecationNotice;
    }
}
