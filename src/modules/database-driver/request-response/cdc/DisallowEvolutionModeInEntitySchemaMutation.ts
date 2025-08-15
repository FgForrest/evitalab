import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import type { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode.ts'

export class DisallowEvolutionModeInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'disallowEvolutionModeInEntitySchemaMutation'
    readonly evolutionModes: EvolutionMode[]

    constructor(evolutionModes: EvolutionMode[]) {
        super()
        this.evolutionModes = evolutionModes
    }
}
