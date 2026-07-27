import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'

export class ModifySortableAttributeCompoundSchemaNameMutation  implements ReferenceSortableAttributeCompoundSchemaMutation {
    readonly name: string
    readonly newName: string

    constructor(name: string, newName: string) {
        this.name = name
        this.newName = newName
    }
}
