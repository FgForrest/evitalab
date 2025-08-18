import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'

export class CreateAssociatedDataSchemaMutation extends EntitySchemaMutation {
    readonly kind: string = 'createAssociatedDataSchemaMutation'
    readonly name: string
    readonly description?: string
    readonly deprecationNotice?: string
    readonly type: any
    readonly localized: boolean
    readonly nullable: boolean

    constructor(name: string, type: any, localized: boolean, nullable: boolean, description?: string, deprecationNotice?: string) {
        super()
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.type = type
        this.localized = localized
        this.nullable = nullable
    }
}
