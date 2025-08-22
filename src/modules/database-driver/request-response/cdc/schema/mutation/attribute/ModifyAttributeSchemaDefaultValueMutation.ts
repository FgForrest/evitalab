import type { SchemaMutation } from '@/modules/database-driver/request-response/cdc/schema/mutation/SchemaMutation.ts'

export class ModifyAttributeSchemaDefaultValueMutation implements SchemaMutation {
    readonly name: string
    readonly defaultValue: any

    constructor(name: string, defaultValue: any) {
        this.name = name
        this.defaultValue = defaultValue
    }
}
