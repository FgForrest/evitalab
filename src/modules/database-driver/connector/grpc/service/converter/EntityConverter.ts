import type { GrpcLocalizedAttribute } from '@/modules/database-driver/connector/grpc/gen/GrpcAttribute_pb'
import type {
    GrpcEntityReference,
    GrpcEntityReferenceWithParent,
    GrpcReference,
    GrpcSealedEntity,
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntity_pb'
import type {
    GrpcEvitaAssociatedDataValue,
    GrpcEvitaValue,
    GrpcLocale
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'
import { EntityReferenceWithParent } from '@/modules/database-driver/request-response/data/EntityReferenceWithParent'
import { Attributes } from '@/modules/database-driver/request-response/data/Attributes'
import { Reference } from '@/modules/database-driver/request-response/data/Reference'
import {
    GrpcCardinality, GrpcEntityScope,
    GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType,
    GrpcPriceInnerRecordHandling
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import type { GrpcLocalizedAssociatedData } from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedData_pb'
import type { GrpcPrice } from '@/modules/database-driver/connector/grpc/gen/GrpcPrice_pb'
import { Price } from '@/modules/database-driver/request-response/data/Price'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { EntityReference } from '@/modules/database-driver/request-response/data/EntityReference'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { EvitaValueConverter } from './EvitaValueConverter'
import { AssociatedData } from '@/modules/database-driver/request-response/data/AssociatedData'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { DateTimeUtil } from '@/modules/database-driver/connector/grpc/utils/DateTimeUtil'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

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
            this.convertLocales(grpcEntity.locales),
            this.convertEntityScope(grpcEntity.scope)
        )
    }
    private convertEntityScope(entityScope: GrpcEntityScope): EntityScope {
        switch (entityScope) {
            case GrpcEntityScope.SCOPE_ARCHIVED:
                return EntityScope.Archive
            case GrpcEntityScope.SCOPE_LIVE:
                return EntityScope.Live
        }
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
        const globalAttributes: ImmutableMap<string, any> = this.convertAttributeMap(grpcGlobalAttributes)

        const localizedAttributes: Map<string, ImmutableMap<string, any>> = new Map<string, ImmutableMap<string, any>>()
        for (const locale in grpcLocalizedAttributes) {
            const attributesForLocale: GrpcLocalizedAttribute = grpcLocalizedAttributes[locale]
            const convertedAttributes: ImmutableMap<string, any> = this.convertAttributeMap(attributesForLocale.attributes)
            localizedAttributes.set(locale, convertedAttributes)
        }

        return new Attributes(globalAttributes, ImmutableMap<string, ImmutableMap<string, any>>(localizedAttributes))
    }

    private convertAttributeMap(grpcAttributeMap: { [key: string]: GrpcEvitaValue }): ImmutableMap<string, any> {
        const attributeMap: Map<string, any> = new Map<string, any>()
        for (const attributeName in grpcAttributeMap) {
            const attributeValue: GrpcEvitaValue = grpcAttributeMap[attributeName]
            if (attributeValue.value.value != undefined) {
                attributeMap.set(
                    attributeName,
                    this.evitaValueConverter.convertGrpcValue(attributeValue, attributeValue.value.case)
                )
            }
        }
        return ImmutableMap(attributeMap)
    }

    private convertReferences(grpcReferences: GrpcReference[]): ImmutableList<Reference> {
        return ImmutableList(grpcReferences.map(it => this.convertReference(it)))
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
        const globalAssociatedData: ImmutableMap<string, any> = this.convertAssociatedDataMap(grpcGlobalAssociatedData)

        const localizedAssociatedData: Map<string, ImmutableMap<string, any>> = new Map<string, ImmutableMap<string, any>>()
        for (const locale in grpcLocalizedAssociatedData) {
            const associatedDataForLocale: GrpcLocalizedAssociatedData = grpcLocalizedAssociatedData[locale]
            const convertedAssociatedData: ImmutableMap<string, any> = this.convertAssociatedDataMap(associatedDataForLocale.associatedData)
            localizedAssociatedData.set(locale, convertedAssociatedData)
        }

        return new AssociatedData(globalAssociatedData, ImmutableMap(localizedAssociatedData))
    }

    private convertAssociatedDataMap(grpcAssociatedDataMap: {
        [key: string]: GrpcEvitaAssociatedDataValue
    }): ImmutableMap<string, any> {
        const associatedDataMap: Map<string, any> = new Map<string, any>()
        for (const associatedValueName in grpcAssociatedDataMap) {
            const associatedDataValue = grpcAssociatedDataMap[associatedValueName]
            associatedDataMap.set(
                associatedValueName,
                this.convertAssociatedDataValue(associatedDataValue)
            )
        }
        return ImmutableMap(associatedDataMap)
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
            return this.evitaValueConverter.convertGrpcValue(value.value.value, value.value.case)
        }
    }

    private convertLocales(locales: GrpcLocale[]): ImmutableList<Locale> {
        const newLocales: Locale[] = []
        for (const locale of locales) {
            newLocales.push(new Locale(locale.languageTag))
        }
        return ImmutableList(newLocales)
    }

    private convertPrices(grpcPrices: GrpcPrice[]): ImmutableList<Price> {
        return ImmutableList(grpcPrices.map(it => this.convertPrice(it)))
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
            grpcPrice.indexed,
            grpcPrice.version,
            new Currency(grpcPrice.currency?.code!)
        )
    }
}
