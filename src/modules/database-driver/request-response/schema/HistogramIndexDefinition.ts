import type { Map } from 'immutable'
import type { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'

/**
 * evitaLab's representation of a bucketed histogram index definition independent of specific evitaDB version.
 */
export class HistogramIndexDefinition {
    readonly nameOfTheIndex: string
    readonly nameVariants: Map<NamingConvention, string>
    readonly valueExpression: string | undefined

    constructor(
        nameOfTheIndex: string,
        nameVariants: Map<NamingConvention, string>,
        valueExpression: string | undefined
    ) {
        this.nameOfTheIndex = nameOfTheIndex
        this.nameVariants = nameVariants
        this.valueExpression = valueExpression
    }
}
