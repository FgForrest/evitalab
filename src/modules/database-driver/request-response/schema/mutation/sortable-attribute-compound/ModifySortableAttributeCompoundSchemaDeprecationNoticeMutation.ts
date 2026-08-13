import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/ReferenceSortableAttributeCompoundSchemaMutation.ts'

export class ModifySortableAttributeCompoundSchemaDeprecationNoticeMutation  implements ReferenceSortableAttributeCompoundSchemaMutation {
    readonly name: string
    readonly deprecationNotice: string|undefined

    constructor(name: string, deprecationNotice: string|undefined) {
        this.name = name
        this.deprecationNotice = deprecationNotice
    }
}
