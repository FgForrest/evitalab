import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export class ModifyAttributeSchemaDefaultValueMutation implements SchemaMutation {
    static readonly TYPE = 'modifyAttributeSchemaDefaultValueMutation' as const

    readonly name: string
    readonly defaultValue: unknown

    constructor(name: string, defaultValue: unknown) {
        this.name = name
        this.defaultValue = defaultValue
    }
}
