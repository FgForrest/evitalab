import { List as ImmutableList } from 'immutable'
import type { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode.ts'

export class AllowEvolutionModeInEntitySchemaMutation {
    readonly evolutionModes: ImmutableList<EvolutionMode>

    constructor(evolutionModes: ImmutableList<EvolutionMode>) {
        this.evolutionModes = evolutionModes
    }
}
