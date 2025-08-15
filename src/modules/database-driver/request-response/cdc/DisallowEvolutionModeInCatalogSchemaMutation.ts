import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import type { CatalogEvolutionMode } from '@/modules/database-driver/request-response/cdc/CatalogEvolutionMode.ts'
import { List as ImmutableList } from 'immutable'

export class DisallowEvolutionModeInCatalogSchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'disallowEvolutionModeInCatalogSchemaMutation'
    readonly evolutionModes: ImmutableList<CatalogEvolutionMode>

    constructor(evolutionModes: ImmutableList<CatalogEvolutionMode>) {
        super()
        this.evolutionModes = evolutionModes
    }
}
