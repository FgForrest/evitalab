import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/cdc/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaRelatedEntityGroupMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly referencedGroupType: string
    readonly referencedGroupTypeManaged: boolean

    constructor(name: string, referencedGroupType: string, referencedGroupTypeManaged: boolean) {
        super(name)
        this.referencedGroupType = referencedGroupType
        this.referencedGroupTypeManaged = referencedGroupTypeManaged
    }
}
