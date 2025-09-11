// todo pfi: přejmenovat adresář na associated-data
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export class AbstractModifyAssociatedDataSchemaMutation implements SchemaMutation{
    readonly name: string

    constructor(name: string) {
        this.name = name
    }
}
