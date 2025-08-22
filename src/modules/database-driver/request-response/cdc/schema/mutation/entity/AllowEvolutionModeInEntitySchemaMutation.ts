import type { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode.ts'
import { List as ImmutableList } from 'immutable'

export class AllowEvolutionModeInEntitySchemaMutation {
    readonly evolutionModes: ImmutableList<EvolutionMode>

    constructor(evolutionModes: ImmutableList<EvolutionMode>) {
        this.evolutionModes = evolutionModes
    }
}
