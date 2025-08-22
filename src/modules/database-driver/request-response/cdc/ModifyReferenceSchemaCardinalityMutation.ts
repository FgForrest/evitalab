import type { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'

export class ModifyReferenceSchemaCardinalityMutation {
    readonly name: string
    readonly cardinality: Cardinality

    constructor(name: string, cardinality: Cardinality) {
        this.name = name
        this.cardinality = cardinality
    }
}
