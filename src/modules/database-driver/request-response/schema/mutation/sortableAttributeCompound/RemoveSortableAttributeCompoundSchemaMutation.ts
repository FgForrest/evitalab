import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'

export class RemoveSortableAttributeCompoundSchemaMutation  implements ReferenceSortableAttributeCompoundSchemaMutation {
    readonly name: string

    constructor(name: string) {
        this.name = name
    }
}
