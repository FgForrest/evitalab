import { EntityReference } from './EntityReference'
import { Attributes } from './Attributes'
import { Cardinality } from '../schema/Cardinality'
import { List, Set } from 'immutable'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { AttributeValue } from '@/modules/database-driver/request-response/data/AttributeValue'

/**
 * References refer to other entities (of same or different entity type).
 * Allows entity filtering (but not sorting) of the entities by using `facetHaving constraint`
 * and statistics computation if when {@link FacetStatistics} requirement is used. Reference
 * is uniquely represented by int positive number (max. 2<sup>63</sup>-1) and entity type and can be
 * part of multiple reference groups, that are also represented by int and entity type.
 */
export class Reference {

    readonly referenceName: string
    readonly version: number

    readonly referencedEntity: EntityReference
    readonly groupReferencedEntity: EntityReference | undefined

    private readonly _attributes: Attributes

    readonly referenceCardinality: Cardinality

    constructor(
        referenceName: string,
        version: number,
        referencedEntity: EntityReference,
        groupReferencedEntity: EntityReference | undefined,
        attributes: Attributes,
        referenceCardinality: Cardinality
    ) {
        this.referenceName = referenceName
        this.version = version
        this.referencedEntity = referencedEntity
        this.groupReferencedEntity = groupReferencedEntity
        this._attributes = attributes
        this.referenceCardinality = referenceCardinality
    }

    get referencedPrimaryKey(): number {
        return this.referencedEntity.primaryKey
    }

    get referencedEntityType(): string {
        return this.referencedEntity.entityType
    }

    attribute(attributeName: string): unknown
    attribute(attributeName: string, locale?: Locale): unknown
    attribute(attributeName: string, locale?: Locale): unknown {
        if (locale == undefined) {
            return this._attributes.attribute(attributeName)
        }
        return this._attributes.attribute(attributeName, locale)
    }

    get allAttributes(): List<AttributeValue> {
        return this._attributes.allAttributes
    }

    get attributeNames(): Set<string> {
        return this._attributes.names
    }

    get attributeLocales(): Set<Locale> {
        return this._attributes.locales
    }
}
