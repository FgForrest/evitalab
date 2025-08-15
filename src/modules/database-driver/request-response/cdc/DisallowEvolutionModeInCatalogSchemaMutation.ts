import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import type { CatalogEvolutionMode } from '@/modules/database-driver/request-response/cdc/CatalogEvolutionMode.ts'

export class DisallowEvolutionModeInCatalogSchemaMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'disallowEvolutionModeInCatalogSchemaMutation'
    readonly evolutionModes: CatalogEvolutionMode[]

    constructor(evolutionModes: CatalogEvolutionMode[]) {
        super()
        this.evolutionModes = evolutionModes
    }
}
