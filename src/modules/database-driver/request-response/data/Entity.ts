import { EntityReferenceWithParent } from './EntityReferenceWithParent'
import { Attributes } from './Attributes'
import { Price } from './Price'
import { Reference } from './Reference'
import { List, Set } from 'immutable'
import { AssociatedData } from '@/modules/database-driver/request-response/data/AssociatedData'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { AttributeValue } from '@/modules/database-driver/request-response/data/AttributeValue'
import { AssociatedDataValue } from '@/modules/database-driver/request-response/data/AssociatedDataValue'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * evitaLab's representation of a single evitaDB entity independent of specific evitaDB version
 * Note: this is a temporary simple "implementation", in the future, we want full rich implementation
 * of the entity object.
 */
export class Entity extends EntityReferenceWithParent {

    readonly schemaVersion: number

    private readonly _attributes: Attributes

    private readonly _associatedData: AssociatedData

    readonly references: List<Reference>

    readonly priceInnerRecordHandling: PriceInnerRecordHandling
    readonly prices: List<Price>
    readonly priceForSale: Price | undefined

    readonly locales: List<Locale>
    readonly scope: EntityScope

    constructor(
        entityType: string,
        primaryKey: number,
        version: number,
        schemaVersion: number,
        parentEntity: EntityReferenceWithParent | undefined,
        attributes: Attributes,
        associatedData: AssociatedData,
        references: List<Reference>,
        priceInnerRecordHandling: PriceInnerRecordHandling,
        prices: List<Price>,
        priceForSale: Price | undefined,
        locales: List<Locale>,
        scope: EntityScope
    ) {
        super(entityType, primaryKey, version, parentEntity)
        this.schemaVersion = schemaVersion
        this._attributes = attributes
        this._associatedData = associatedData
        this.references = references
        this.priceInnerRecordHandling = priceInnerRecordHandling
        this.prices = prices
        this.priceForSale = priceForSale
        this.locales = locales
        this.scope = scope
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

    associatedData(associatedDataName: string): any | undefined
    associatedData(associatedDataName: string, locale?: Locale): any | undefined
    associatedData(associatedDataName: string, locale?: Locale): any | undefined {
        if (locale == undefined) {
            return this._associatedData.associatedData(associatedDataName)
        }
        return this._associatedData.associatedData(associatedDataName, locale)
    }

    get allAssociatedData(): List<AssociatedDataValue> {
        return this._associatedData.allAssociatedData
    }

    // todo lho references
}
