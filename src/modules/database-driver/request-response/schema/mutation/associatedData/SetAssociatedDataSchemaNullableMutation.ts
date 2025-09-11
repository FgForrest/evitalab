import {
    AbstractModifyAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/AbstractModifyAssociatedDataSchemaMutation.ts'

export class SetAssociatedDataSchemaNullableMutation extends AbstractModifyAssociatedDataSchemaMutation {
    readonly nullable: boolean

    constructor(name: string, nullable: boolean) {
        super(name)
        this.nullable = nullable
    }
}
