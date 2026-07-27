import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export class ModifyAttributeSchemaDefaultValueMutation implements SchemaMutation {
    static readonly TYPE = 'modifyAttributeSchemaDefaultValueMutation' as const

    readonly name: string
    readonly defaultValue: EvitaValue

    constructor(name: string, defaultValue: EvitaValue) {
        this.name = name
        this.defaultValue = defaultValue
    }
}
