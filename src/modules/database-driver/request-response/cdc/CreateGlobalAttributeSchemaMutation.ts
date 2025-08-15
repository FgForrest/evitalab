import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'

export class CreateGlobalAttributeSchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'createGlobalAttributeSchemaMutation'
    readonly name: string
    readonly description?: string
    readonly deprecationNotice?: string
    readonly unique: boolean
    readonly filterable: boolean
    readonly sortable: boolean
    readonly localized: boolean
    readonly nullable: boolean
    readonly representative: boolean
    readonly type: string
    readonly indexedDecimalPlaces: number
    readonly defaultValue?: string | number | boolean | null
    readonly uniqueGlobally: boolean

    constructor(
        name: string,
        description: string | undefined,
        deprecationNotice: string | undefined,
        unique: boolean,
        filterable: boolean,
        sortable: boolean,
        localized: boolean,
        nullable: boolean,
        representative: boolean,
        type: string,
        indexedDecimalPlaces: number,
        defaultValue: string | number | boolean | null | undefined,
        uniqueGlobally: boolean,
    ) {
        super()
        this.name = name
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.unique = unique
        this.filterable = filterable
        this.sortable = sortable
        this.localized = localized
        this.nullable = nullable
        this.representative = representative
        this.type = type
        this.indexedDecimalPlaces = indexedDecimalPlaces
        this.defaultValue = defaultValue
        this.uniqueGlobally = uniqueGlobally
    }
}
