import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'

export class SetAssociatedDataSchemaLocalizedMutation extends AbstractModifyAssociatedDataSchemaMutation {
    readonly localized: boolean
    constructor(name: string, localized: boolean) {
        super(name)
        this.localized = localized
    }
}
