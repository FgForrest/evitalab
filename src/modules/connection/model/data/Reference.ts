import { EntityReference } from './EntityReference'
import { Attributes } from './Attributes'
import { Cardinality } from '../schema/Cardinality'
import { List, Set } from 'immutable'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { AttributeValue } from '@/modules/connection/model/data/AttributeValue'

//TODO: Add documentation
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

    attribute(attributeName: string): any | undefined
    attribute(attributeName: string, locale?: Locale): any | undefined
    attribute(attributeName: string, locale?: Locale): any | undefined {
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
