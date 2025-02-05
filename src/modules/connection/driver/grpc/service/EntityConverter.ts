import { GrpcLocalizedAttribute } from '@/modules/connection/driver/grpc/gen/GrpcAttribute_pb'
import {
    GrpcEntityReference,
    GrpcEntityReferenceWithParent,
    GrpcReference,
    GrpcSealedEntity,
} from '@/modules/connection/driver/grpc/gen/GrpcEntity_pb'
import {
    GrpcEvitaAssociatedDataValue,
    GrpcEvitaValue,
    GrpcLocale
} from '@/modules/connection/driver/grpc/gen/GrpcEvitaDataTypes_pb'
import { Entity } from '@/modules/connection/model/data/Entity'
import { EntityReferenceWithParent } from '@/modules/connection/model/data/EntityReferenceWithParent'
import { Attributes } from '@/modules/connection/model/data/Attributes'
import { Reference } from '@/modules/connection/model/data/Reference'
import {
    GrpcCardinality,
    GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType,
    GrpcPriceInnerRecordHandling,
} from '@/modules/connection/driver/grpc/gen/GrpcEnums_pb'
import { GrpcLocalizedAssociatedData } from '@/modules/connection/driver/grpc/gen/GrpcAssociatedData_pb'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { GrpcPrice } from '@/modules/connection/driver/grpc/gen/GrpcPrice_pb'
import { Price } from '@/modules/connection/model/data/Price'
import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import { DateTimeUtil as DateTimeUtil } from '@/modules/connection/driver/grpc/utils/DateTimeUtil'
import { PriceInnerRecordHandling } from '@/modules/connection/model/data-type/PriceInnerRecordHandling'
import { EntityReference } from '@/modules/connection/model/data/EntityReference'
import { Cardinality } from '@/modules/connection/model/schema/Cardinality'
import Immutable from 'immutable'
import { EvitaValueConverter } from './EvitaValueConverter'
import { AssociatedData } from '@/modules/connection/model/data/AssociatedData'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Currency } from '@/modules/connection/model/data-type/Currency'

//TODO: Add documentation
export class EntityConverter {
    private readonly evitaValueConverter: EvitaValueConverter;

    constructor(evitaValueConverter: EvitaValueConverter){
        this.evitaValueConverter = evitaValueConverter
    }

    convert(grpcEntity: GrpcSealedEntity): Entity {
        return new Entity(
            grpcEntity.entityType,
            grpcEntity.primaryKey,
            grpcEntity.version,
            grpcEntity.schemaVersion,
            this.convertParentEntity(grpcEntity.parentReference, grpcEntity.parentEntity),
            this.convertAttributes(grpcEntity.globalAttributes, grpcEntity.localizedAttributes),
            this.convertAssociatedData(grpcEntity.globalAssociatedData, grpcEntity.localizedAssociatedData),
            this.convertReferences(grpcEntity.references),
            this.convertPriceInnerHandling(grpcEntity.priceInnerRecordHandling),
            this.convertPrices(grpcEntity.prices),
            grpcEntity.priceForSale
                ? this.convertPrice(grpcEntity.priceForSale)
                : undefined,
            this.convertLocales(grpcEntity.locales)
        )
    }

    private convertEntityReference(grpcEntityReference: GrpcEntityReference): EntityReference {
        return new EntityReference(
            grpcEntityReference.entityType,
            grpcEntityReference.primaryKey,
            grpcEntityReference.version
        )
    }

    private convertEntityReferenceWithParent(grpcEntityReferenceWithParent: GrpcEntityReferenceWithParent): EntityReferenceWithParent {
        return new EntityReferenceWithParent(
            grpcEntityReferenceWithParent.entityType,
            grpcEntityReferenceWithParent.primaryKey,
            grpcEntityReferenceWithParent.version,
            grpcEntityReferenceWithParent.parent != undefined
                ? this.convertEntityReferenceWithParent(grpcEntityReferenceWithParent.parent)
                : undefined
        )
    }

    private convertParentEntity(grpcParentReference: GrpcEntityReferenceWithParent | undefined,
                                grpcParentEntity: GrpcSealedEntity | undefined): EntityReferenceWithParent | undefined {
        if (grpcParentEntity != undefined) {
            return this.convert(grpcParentEntity)
        } else if (grpcParentReference != undefined) {
            return this.convertEntityReferenceWithParent(grpcParentReference)
        } else {
            return undefined
        }
    }

    private convertAttributes(
        grpcGlobalAttributes: {
            [key: string]: GrpcEvitaValue
        },
        grpcLocalizedAttributes: {
            [key: string]: GrpcLocalizedAttribute
        }
    ): Attributes {
        const globalAttributes: Immutable.Map<string, any> = this.convertAttributeMap(grpcGlobalAttributes)

        const localizedAttributes: Map<string, Immutable.Map<string, any>> = new Map<string, Immutable.Map<string, any>>()
        for (const locale in grpcLocalizedAttributes) {
            const attributesForLocale: GrpcLocalizedAttribute = grpcLocalizedAttributes[locale]
            const convertedAttributes: Immutable.Map<string, any> = this.convertAttributeMap(attributesForLocale.attributes)
            localizedAttributes.set(locale, convertedAttributes)
        }

        return new Attributes(globalAttributes, Immutable.Map<string, Immutable.Map<string, any>>(localizedAttributes))
    }

    private convertAttributeMap(grpcAttributeMap: { [key: string]: GrpcEvitaValue }): Immutable.Map<string, any> {
        const attributeMap: Map<string, any> = new Map<string, any>()
        for (const attributeName in grpcAttributeMap) {
            const attributeValue: GrpcEvitaValue = grpcAttributeMap[attributeName]
            if (attributeValue.value.value != undefined) {
                attributeMap.set(
                    attributeName,
                    this.evitaValueConverter.convertGrpcValue(attributeValue)
                )
            }
        }
        return Immutable.Map(attributeMap)
    }

    private convertReferences(grpcReferences: GrpcReference[]): Immutable.List<Reference> {
        return Immutable.List(grpcReferences.map(it => this.convertReference(it)))
    }

    private convertReference(grpcReference: GrpcReference): Reference {
        return new Reference(
            grpcReference.referenceName,
            grpcReference.version,
            this.convertReferencedEntity(
                grpcReference.referencedEntity,
                grpcReference.referencedEntityReference
            ),
            this.convertGroupReferencedEntity(grpcReference),
            this.convertAttributes(
                grpcReference.globalAttributes,
                grpcReference.localizedAttributes
            ),
            this.convertCardinality(grpcReference.referenceCardinality)
        )
    }

    private convertReferencedEntity(grpcReferencedEntity: GrpcSealedEntity | undefined,
                                    grpcReferencedEntityReference: GrpcEntityReference | undefined): EntityReference {
        if (grpcReferencedEntity != undefined) {
            return this.convert(grpcReferencedEntity)
        } else if (grpcReferencedEntityReference != undefined) {
            return this.convertEntityReference(grpcReferencedEntityReference)
        } else {
            throw new UnexpectedError('Missing both referenced entity and referenced entity reference in reference.')
        }
    }

    private convertGroupReferencedEntity(grpcReference: GrpcReference): EntityReference | undefined {
        if (grpcReference.groupReferenceType.case === "groupReferencedEntity") {
            return this.convert(grpcReference.groupReferenceType.value)
        } else if (grpcReference.groupReferenceType.case === "groupReferencedEntityReference") {
            return this.convertEntityReference(grpcReference.groupReferenceType.value)
        } else {
            return undefined
        }
    }

    private convertCardinality(cardinality: GrpcCardinality): Cardinality {
        switch (cardinality) {
            case GrpcCardinality.EXACTLY_ONE:
                return Cardinality.ExactlyOne
            case GrpcCardinality.NOT_SPECIFIED:
                return Cardinality.ExactlyOne
            case GrpcCardinality.ONE_OR_MORE:
                return Cardinality.OneOrMore
            case GrpcCardinality.ZERO_OR_MORE:
                return Cardinality.ZeroOrMore
            case GrpcCardinality.ZERO_OR_ONE:
                return Cardinality.ZeroOrOne
        }
    }

    private convertPriceInnerHandling(
        price: GrpcPriceInnerRecordHandling
    ): PriceInnerRecordHandling {
        switch (price) {
            case GrpcPriceInnerRecordHandling.LOWEST_PRICE:
                return PriceInnerRecordHandling.LowestPrice
            case GrpcPriceInnerRecordHandling.NONE:
                return PriceInnerRecordHandling.None
            case GrpcPriceInnerRecordHandling.SUM:
                return PriceInnerRecordHandling.Sum
            case GrpcPriceInnerRecordHandling.UNKNOWN:
                return PriceInnerRecordHandling.Unknown
        }
    }

    private convertAssociatedData(
        grpcGlobalAssociatedData: {
            [key: string]: GrpcEvitaAssociatedDataValue
        },
        grpcLocalizedAssociatedData: {
            [key: string]: GrpcLocalizedAssociatedData
        }
    ): AssociatedData {
        const globalAssociatedData: Immutable.Map<string, any> = this.convertAssociatedDataMap(grpcGlobalAssociatedData)

        const localizedAssociatedData: Map<string, Immutable.Map<string, any>> = new Map<string, Immutable.Map<string, any>>()
        for (const locale in grpcLocalizedAssociatedData) {
            const associatedDataForLocale: GrpcLocalizedAssociatedData = grpcLocalizedAssociatedData[locale]
            const convertedAssociatedData: Immutable.Map<string, any> = this.convertAssociatedDataMap(associatedDataForLocale.associatedData)
            localizedAssociatedData.set(locale, convertedAssociatedData)
        }

        return new AssociatedData(globalAssociatedData, Immutable.Map(localizedAssociatedData))
    }

    private convertAssociatedDataMap(grpcAssociatedDataMap: {
        [key: string]: GrpcEvitaAssociatedDataValue
    }): Immutable.Map<string, any> {
        const associatedDataMap: Map<string, any> = new Map<string, any>()
        for (const associatedValueName in grpcAssociatedDataMap) {
            const associatedDataValue = grpcAssociatedDataMap[associatedValueName]
            associatedDataMap.set(
                associatedValueName,
                this.convertAssociatedDataValue(associatedDataValue)
            )
        }
        return Immutable.Map(associatedDataMap)
    }

    private convertAssociatedDataValue(
        value: GrpcEvitaAssociatedDataValue
    ): object {
        if (
            value.type ===
            GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.COMPLEX_DATA_OBJECT
        ) {
            return JSON.parse(value.value.value as string)
        } else {
            return this.evitaValueConverter.convertGrpcValue(value.value.value)
        }
    }

    private convertLocales(locales: GrpcLocale[]): Immutable.List<Locale> {
        const newLocales: Locale[] = []
        for (const locale of locales) {
            newLocales.push(new Locale(locale.languageTag))
        }
        return Immutable.List(newLocales)
    }

    private convertPrices(grpcPrices: GrpcPrice[]): Immutable.List<Price> {
        return Immutable.List(grpcPrices.map(it => this.convertPrice(it)))
    }

    private convertPrice(grpcPrice: GrpcPrice) {
        if (grpcPrice.priceWithTax == undefined ||
            grpcPrice.priceWithoutTax == undefined ||
            grpcPrice.taxRate == undefined) {
            throw new UnexpectedError(`Missing mandatory price data for price '${grpcPrice.priceId}'.`)
        }

        return new Price(
            grpcPrice.priceId,
            grpcPrice.priceList,
            grpcPrice.innerRecordId,
            new BigDecimal(grpcPrice.priceWithoutTax.valueString),
            new BigDecimal(grpcPrice.taxRate.valueString),
            new BigDecimal(grpcPrice.priceWithTax.valueString),
            grpcPrice.validity != undefined
                ? DateTimeUtil.convertToDateTimeRange(grpcPrice.validity)
                : undefined,
            grpcPrice.sellable,
            grpcPrice.version,
            new Currency(grpcPrice.currency?.code!)
        )
    }
}
