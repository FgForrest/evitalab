import type {
    SortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/SortableAttributeCompoundSchemaMutation.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'

export class ModifySortableAttributeCompoundSchemaDescriptionMutation  implements ReferenceSortableAttributeCompoundSchemaMutation {
    readonly name: string
    readonly description: string|undefined

    constructor(name: string, description: string|undefined) {
        this.name = name
        this.description = description
    }
}
