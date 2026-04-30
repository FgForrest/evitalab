import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    HistogramIndexDefinition
} from '@/modules/database-driver/request-response/schema/HistogramIndexDefinition.ts'

/**
 * Pairs a histogram index definition with the entity scope in which it applies.
 */
export class ScopedHistogramIndexDefinition {
    readonly scope: EntityScope
    readonly definition: HistogramIndexDefinition

    constructor(scope: EntityScope, definition: HistogramIndexDefinition) {
        this.scope = scope
        this.definition = definition
    }
}
