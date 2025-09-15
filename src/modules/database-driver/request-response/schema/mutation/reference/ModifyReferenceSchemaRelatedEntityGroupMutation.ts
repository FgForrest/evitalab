import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'

export class ModifyReferenceSchemaRelatedEntityGroupMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly referencedGroupType: string|undefined
    readonly referencedGroupTypeManaged: boolean

    constructor(name: string, referencedGroupType: string|undefined, referencedGroupTypeManaged: boolean) {
        super(name)
        this.referencedGroupType = referencedGroupType
        this.referencedGroupTypeManaged = referencedGroupTypeManaged
    }
}
