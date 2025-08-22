import type { SchemaMutation } from '@/modules/database-driver/request-response/cdc/schema/mutation/SchemaMutation.ts'

export class CreateAssociatedDataSchemaMutation implements SchemaMutation {
    readonly name: string
    readonly description: string
    readonly deprecationNotice: string
    readonly type: any
    readonly localized: boolean
    readonly nullable: boolean


    constructor(name: string, description: string, deprecationNotice: string, type: any, localized: boolean, nullable: boolean) {
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.type = type
        this.localized = localized
        this.nullable = nullable
    }
}
