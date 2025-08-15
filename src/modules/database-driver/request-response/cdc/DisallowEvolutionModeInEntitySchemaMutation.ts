import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import type { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode.ts'
import { List as ImmutableList } from 'immutable'

export class DisallowEvolutionModeInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'disallowEvolutionModeInEntitySchemaMutation'
    readonly evolutionModes: ImmutableList<EvolutionMode>

    constructor(evolutionModes: ImmutableList<EvolutionMode>) {
        super()
        this.evolutionModes = evolutionModes
    }
}
