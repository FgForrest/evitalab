import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import { Scalar } from '@/modules/database-driver/data-type/Scalar.ts'

export class CreateAssociatedDataSchemaMutation implements SchemaMutation {
    readonly name: string
    readonly description?: string
    readonly deprecationNotice?: string
    readonly type: Scalar
    readonly localized: boolean
    readonly nullable: boolean


    constructor(name: string, description: string|undefined=undefined, deprecationNotice: string|undefined=undefined, type: Scalar, localized: boolean, nullable: boolean) {
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.type = type
        this.localized = localized
        this.nullable = nullable
    }
}
