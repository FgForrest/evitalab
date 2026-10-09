import { Locale } from '@/modules/database-driver/data-type/Locale'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'

/**
 * The cardinality reading of one global unique index of the catalog index.
 */
export class GlobalUniqueIndexCardinality {

    readonly attributeName: string
    /**
     * Locale this index is bound to; unset when the attribute is unique globally across every locale.
     */
    readonly locale: Locale | undefined
    readonly scope: EntityScope
    /**
     * Distinct values, not covered records: a globally-unique attribute that is also localized has a single
     * locale-less key covering every locale, so one record can own several values in it.
     */
    readonly distinctValueCount: number

    constructor(
        attributeName: string,
        locale: Locale | undefined,
        scope: EntityScope,
        distinctValueCount: number
    ) {
        this.attributeName = attributeName
        this.locale = locale
        this.scope = scope
        this.distinctValueCount = distinctValueCount
    }
}
