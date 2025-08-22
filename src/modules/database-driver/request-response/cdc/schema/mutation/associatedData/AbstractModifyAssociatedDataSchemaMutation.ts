import type { SchemaMutation } from '@/modules/database-driver/request-response/cdc/schema/mutation/SchemaMutation.ts'

export class AbstractModifyAssociatedDataSchemaMutation implements SchemaMutation{
    readonly name: string

    constructor(name: string) {
        this.name = name
    }
}
