import type { CatalogEvolutionMode } from '@/modules/database-driver/request-response/cdc/CatalogEvolutionMode.ts'
import { List as ImmutableList } from 'immutable'

export class AllowEvolutionModeInCatalogSchemaMutation{
    readonly evolutionModes: ImmutableList<CatalogEvolutionMode>

    constructor(evolutionModes: ImmutableList<CatalogEvolutionMode>) {
        this.evolutionModes = evolutionModes
    }
}
