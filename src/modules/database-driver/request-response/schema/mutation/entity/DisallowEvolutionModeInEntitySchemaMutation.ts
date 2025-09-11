import { Set as ImmutableSet } from 'immutable'
import type { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode.ts'

export class DisallowEvolutionModeInEntity {
    readonly evolutionModes: ImmutableSet<EvolutionMode>

    constructor(evolutionModes: ImmutableSet<EvolutionMode>) {
        this.evolutionModes = evolutionModes
    }
}
