import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSortableAttributeCompoundSchemaMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly referencedEntityType: string
    readonly referencedEntityTypeManaged: boolean

    constructor(name: string, referencedEntityType: string, referencedEntityTypeManaged: boolean) {
        super(name)
        this.referencedEntityType = referencedEntityType
        this.referencedEntityTypeManaged = referencedEntityTypeManaged
    }
}
