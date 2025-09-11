import { List as ImmutableList } from 'immutable'
import type { CatalogEvolutionMode } from '@/modules/database-driver/request-response/schema/CatalogEvolutionMode.ts'

export class AllowEvolutionModeInCatalogSchemaMutation {
    readonly evolutionModes: ImmutableList<CatalogEvolutionMode>

    constructor(evolutionModes: ImmutableList<CatalogEvolutionMode>) {
        this.evolutionModes = evolutionModes
    }
}
