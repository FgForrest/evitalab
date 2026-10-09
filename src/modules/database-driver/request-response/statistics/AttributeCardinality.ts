import { Locale } from '@/modules/database-driver/data-type/Locale'
import { AttributeIndexType } from '@/modules/database-driver/request-response/statistics/AttributeIndexType'

/**
 * The cardinality readings of one attribute index within one entity index.
 */
export class AttributeCardinality {

    readonly attributeName: string
    /**
     * Name of the reference the attribute is defined on. Unset for an attribute defined directly on the entity.
     */
    readonly referenceName: string | undefined
    /**
     * Locale of the indexed values. Unset when the attribute is not localized; a localized attribute has one index
     * per locale and each is reported separately, because their selectivities genuinely differ.
     */
    readonly locale: Locale | undefined
    readonly indexType: AttributeIndexType
    readonly distinctValueCount: number
    /**
     * How many records those values cover between them. Not interchangeable with {@link distinctValueCount} even for
     * a unique index - a globally-unique attribute that is also localized lets one record own several values.
     */
    readonly recordsCovered: number

    constructor(
        attributeName: string,
        referenceName: string | undefined,
        locale: Locale | undefined,
        indexType: AttributeIndexType,
        distinctValueCount: number,
        recordsCovered: number
    ) {
        this.attributeName = attributeName
        this.referenceName = referenceName
        this.locale = locale
        this.indexType = indexType
        this.distinctValueCount = distinctValueCount
        this.recordsCovered = recordsCovered
    }

    /**
     * Distinct values per covered record. Near 1 is a near-unique index; near 0 is a low-selectivity index worth
     * questioning. Undefined when the index covers no record at all.
     */
    get cardinalityRatio(): number | undefined {
        return this.recordsCovered === 0 ? undefined : this.distinctValueCount / this.recordsCovered
    }
}
