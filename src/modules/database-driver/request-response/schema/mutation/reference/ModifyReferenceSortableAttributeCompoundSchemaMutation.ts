import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'


export class ModifyReferenceSortableAttributeCompoundSchemaMutation extends AbstractModifyReferenceDataSchemaMutation {

    private readonly sortableAttributeCompoundSchemaMutation: ReferenceSortableAttributeCompoundSchemaMutation

    constructor(name: string, sortableAttributeCompoundSchemaMutation: ReferenceSortableAttributeCompoundSchemaMutation) {
        super(name)
        this.sortableAttributeCompoundSchemaMutation = sortableAttributeCompoundSchemaMutation
    }
}
