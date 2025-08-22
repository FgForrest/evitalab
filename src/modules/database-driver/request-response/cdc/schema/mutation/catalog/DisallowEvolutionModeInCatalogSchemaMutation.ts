import { Set as ImmutableSet } from 'immutable'
import type {
    CatalogEvolutionMode
} from '@/modules/database-driver/request-response/cdc/schema/CatalogEvolutionMode.ts'
export class DisallowEvolutionModeInCatalogSchemaMutation {
    readonly evolutionModes: ImmutableSet<CatalogEvolutionMode>

    constructor(evolutionModes: ImmutableSet<CatalogEvolutionMode>) {
        this.evolutionModes = evolutionModes
    }
}
