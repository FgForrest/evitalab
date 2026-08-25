import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/ReferenceSortableAttributeCompoundSchemaMutation.ts'


export class ModifyReferenceSortableAttributeCompoundSchemaMutation extends AbstractModifyReferenceDataSchemaMutation {

    readonly sortableAttributeCompoundSchemaMutation: ReferenceSortableAttributeCompoundSchemaMutation

    constructor(name: string, sortableAttributeCompoundSchemaMutation: ReferenceSortableAttributeCompoundSchemaMutation) {
        super(name)
        this.sortableAttributeCompoundSchemaMutation = sortableAttributeCompoundSchemaMutation
    }
}
