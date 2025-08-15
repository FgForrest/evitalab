import { EntitySchemaMutation } from '@/modules/database-driver/request-response/cdc/EntitySchemaMutation.ts'
import type { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode.ts'

export class AllowEvolutionModeInEntitySchemaMutation extends EntitySchemaMutation {
    readonly kind = 'allowEvolutionModeInEntitySchemaMutation'
    readonly evolutionModes: EvolutionMode[]

    constructor(evolutionModes: EvolutionMode[]) {
        super()
        this.evolutionModes = evolutionModes
    }
}
