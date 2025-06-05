import {
    GrpcCatalogSchema,
    GrpcGlobalAttributeSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchema_pb'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { Map, List } from 'immutable'
import { GlobalAttributeSchema } from '@/modules/database-driver/request-response/schema/GlobalAttributeSchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import {
    GrpcAttributeSchemaType,
    GrpcAttributeUniquenessType,
    GrpcCardinality,
    GrpcEvolutionMode,
    GrpcGlobalAttributeUniquenessType,
    GrpcOrderBehaviour,
    GrpcOrderDirection
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { GlobalAttributeUniquenessType } from '@/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode'
import { AttributeUniquenessType } from '@/modules/database-driver/request-response/schema/AttributeUniquenessType'
import { OrderBehaviour } from '@/modules/database-driver/request-response/schema/OrderBehaviour'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import {
    GrpcAssociatedDataSchema,
    GrpcAttributeElement,
    GrpcAttributeSchema,
    GrpcEntitySchema,
    GrpcReferenceSchema,
    GrpcSortableAttributeCompoundSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb'
import {
    GrpcCurrency,
    GrpcLocale
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import {
    AttributeElement,
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { ScalarConverter } from './ScalarConverter'
import { EvitaValueConverter } from './EvitaValueConverter'
import { EntitySchemaAccessor } from '@/modules/database-driver/request-response/schema/EntitySchemaAccessor'
import { MapUtil } from '@/modules/database-driver/connector/grpc/utils/MapUtil'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { Currency } from '@/modules/database-driver/data-type/Currency'

export class CatalogSchemaConverter {
    private readonly evitaValueConverter:EvitaValueConverter

    constructor(evitaValueConverter: EvitaValueConverter){
        this.evitaValueConverter = evitaValueConverter
    }

    convert(
        catalogSchema: GrpcCatalogSchema,
        entitySchemaAccessor: EntitySchemaAccessor
    ): CatalogSchema {
        return new CatalogSchema(
            catalogSchema.version,
            catalogSchema.name,
            MapUtil.getNamingMap(catalogSchema.nameVariant),
            catalogSchema.description,
            this.convertGlobalAttributeSchemas(catalogSchema.attributes),
            entitySchemaAccessor
        )
    }

    private convertGlobalAttributeSchemas(attributeSchemas: {
        [key: string]: GrpcGlobalAttributeSchema
    }): GlobalAttributeSchema[] {
        const globalAttributeSchemas: GlobalAttributeSchema[] = []

        for (const attributeSchema in attributeSchemas) {
            const schema: GrpcGlobalAttributeSchema =
                attributeSchemas[attributeSchema]
            globalAttributeSchemas.push(
                this.convertGlobalAttributeSchema(
                    schema
                ) as GlobalAttributeSchema
            )
        }
        return globalAttributeSchemas
    }

    private convertAttributeSchema(
        attribute: GrpcAttributeSchema
    ): AttributeSchema {
        const scalar = ScalarConverter.convertScalar(attribute.type)
        const nameVariants = MapUtil.getNamingMap(attribute.nameVariant)
        const uniquenessType = this.convertAttributeUniquenessType(attribute.unique)
        if (attribute.schemaType === GrpcAttributeSchemaType.ENTITY) {
            return new AttributeSchema(
                attribute.name,
                nameVariants,
                attribute.description ?? undefined,
                attribute.deprecationNotice ?? undefined,
                scalar,
                uniquenessType,
                attribute.filterable,
                attribute.sortable,
                attribute.nullable,
                this.evitaValueConverter.convertGrpcValue(attribute.defaultValue, attribute.defaultValue?.value.case),
                attribute.localized,
                attribute.indexedDecimalPlaces
            )
        } else if (attribute.schemaType === GrpcAttributeSchemaType.REFERENCE) {
            return new EntityAttributeSchema(
                attribute.name,
                nameVariants,
                attribute.description,
                attribute.deprecationNotice,
                scalar,
                uniquenessType,
                attribute.filterable,
                attribute.sortable,
                attribute.nullable,
                this.evitaValueConverter.convertGrpcValue(attribute.defaultValue, attribute.defaultValue?.value.case),
                attribute.localized,
                attribute.indexedDecimalPlaces,
                attribute.representative
            )
        } else {
            throw new UnexpectedError('Unaccepted type')
        }
    }

    private convertGlobalAttributeSchema(
        globalAttributeSchema: GrpcGlobalAttributeSchema
    ): AttributeSchema {
        return new GlobalAttributeSchema(
            globalAttributeSchema.name,
            MapUtil.getNamingMap(globalAttributeSchema.nameVariant),
            globalAttributeSchema.description,
            globalAttributeSchema.deprecationNotice,
            ScalarConverter.convertScalar(globalAttributeSchema.type),
            this.convertAttributeUniquenessType(globalAttributeSchema.unique),
            globalAttributeSchema.filterable,
            globalAttributeSchema.sortable,
            globalAttributeSchema.nullable,
            this.evitaValueConverter.convertGrpcValue(globalAttributeSchema.defaultValue, globalAttributeSchema.defaultValue?.value.case),
            globalAttributeSchema.localized,
            globalAttributeSchema.indexedDecimalPlaces,
            globalAttributeSchema.representative,
            this.convertGlobalAttributeUniquenessType(globalAttributeSchema.uniqueGlobally)
        )
    }

    private convertAttributeUniquenessType(
        attributeUniquenessType: GrpcAttributeUniquenessType
    ): AttributeUniquenessType {
        switch (attributeUniquenessType) {
            case GrpcAttributeUniquenessType.NOT_UNIQUE:
                return AttributeUniquenessType.NotUnique
            case GrpcAttributeUniquenessType.UNIQUE_WITHIN_COLLECTION:
                return AttributeUniquenessType.UniqueWithinCollection
            case GrpcAttributeUniquenessType.UNIQUE_WITHIN_COLLECTION_LOCALE:
                return AttributeUniquenessType.UniqueWithinCollectionLocale
            default:
                throw new UnexpectedError(
                    `Unsupported attribute uniqueness type '${attributeUniquenessType}'.`
                )
        }
    }

    private convertGlobalAttributeUniquenessType(
        globalAttributeUniquenessType: GrpcGlobalAttributeUniquenessType
    ): GlobalAttributeUniquenessType {
        switch (globalAttributeUniquenessType) {
            case GrpcGlobalAttributeUniquenessType.NOT_GLOBALLY_UNIQUE:
                return GlobalAttributeUniquenessType.NotUnique
            case GrpcGlobalAttributeUniquenessType.UNIQUE_WITHIN_CATALOG:
                return GlobalAttributeUniquenessType.UniqueWithinCatalog
            case GrpcGlobalAttributeUniquenessType.UNIQUE_WITHIN_CATALOG_LOCALE:
                return GlobalAttributeUniquenessType.UniqueWithinCatalogLocale
            default:
                throw new UnexpectedError(
                    `Unsupported global attribute uniqueness type '${globalAttributeUniquenessType}'.`
                )
        }
    }

    convertEntitySchema(entitySchema: GrpcEntitySchema): EntitySchema {
        return new EntitySchema(
            entitySchema.version,
            entitySchema.name,
            MapUtil.getNamingMap(entitySchema.nameVariant),
            entitySchema.description || undefined,
            entitySchema.deprecationNotice || undefined,
            entitySchema.withGeneratedPrimaryKey,
            entitySchema.withHierarchy,
            entitySchema.withPrice,
            entitySchema.indexedPricePlaces,
            this.convertLocales(entitySchema.locales),
            this.convertCurrency(entitySchema.currencies),
            this.convertEvolutionMode(entitySchema.evolutionMode),
            this.convertEntityAttributeSchemas(entitySchema.attributes),
            this.convertSortableAttributeCompoundSchemas(
                entitySchema.sortableAttributeCompounds
            ),
            this.convertAssociatedDataSchemas(entitySchema.associatedData),
            this.convertReferenceSchemas(entitySchema.references)
        )
    }

    private convertSortableAttributeCompoundSchema(
        sortableAttributeCompoundSchema: GrpcSortableAttributeCompoundSchema
    ): SortableAttributeCompoundSchema {
        return new SortableAttributeCompoundSchema(
            sortableAttributeCompoundSchema.name,
            MapUtil.getNamingMap(sortableAttributeCompoundSchema.nameVariant),
            sortableAttributeCompoundSchema.description,
            sortableAttributeCompoundSchema.deprecationNotice,
            this.convertAttributeElements(
                sortableAttributeCompoundSchema.attributeElements
            )
        )
    }

    private convertAttributeElements(
        attributeElements: GrpcAttributeElement[]
    ): AttributeElement[] {
        return attributeElements.map((it) => this.convertAttributeElement(it))
    }

    private convertAttributeElement(
        attributeElement: GrpcAttributeElement
    ): AttributeElement {
        return new AttributeElement(
            attributeElement.attributeName,
            this.convertOrderBehaviour(attributeElement.behaviour),
            this.convertOrderDirection(attributeElement.direction)
        )
    }

    private convertReferenceSchemas(referenceSchemas: {
        [key: string]: GrpcReferenceSchema
    }): ReferenceSchema[] {
        const newReferenceSchemas: ReferenceSchema[] = []
        for (const referenceName in referenceSchemas) {
            const driverReferenceSchema: GrpcReferenceSchema =
                referenceSchemas[referenceName]
            newReferenceSchemas.push(
                this.convertReferenceSchema(driverReferenceSchema)
            )
        }
        return newReferenceSchemas
    }

    private convertEntityAttributeSchemas(entityAttributeSchemas: {
        [key: string]: GrpcAttributeSchema
    }): EntityAttributeSchema[] {
        const entityAttributesSchemas: EntityAttributeSchema[] = []
        for (const attributeName in entityAttributeSchemas) {
            const driverEntityAttributeSchema: GrpcAttributeSchema =
                entityAttributeSchemas[attributeName]
            entityAttributesSchemas.push(
                this.convertAttributeSchema(
                    driverEntityAttributeSchema
                ) as EntityAttributeSchema
            )
        }
        return entityAttributesSchemas
    }

    private convertReferenceSchema(
        referenceSchema: GrpcReferenceSchema
    ): ReferenceSchema {
        return new ReferenceSchema(
            referenceSchema.name,
            MapUtil.getNamingMap(referenceSchema.nameVariant),
            referenceSchema.description,
            referenceSchema.deprecationNotice,
            referenceSchema.entityType,
            referenceSchema.referencedEntityTypeManaged,
            MapUtil.getNamingMap(referenceSchema.entityTypeNameVariant),
            referenceSchema.groupType,
            referenceSchema.referencedGroupTypeManaged,
            MapUtil.getNamingMap(referenceSchema.groupTypeNameVariant),
            referenceSchema.indexed,
            referenceSchema.faceted,
            this.convertCardinality(referenceSchema.cardinality),
            this.convertAttributeSchemas(referenceSchema.attributes),
            this.convertSortableAttributeCompoundSchemas(
                referenceSchema.sortableAttributeCompounds
            )
        )
    }

    private convertAttributeSchemas(attributeSchemas: {
        [key: string]: GrpcAttributeSchema
    }): AttributeSchema[] {
        const attributesSchemas: AttributeSchema[] = []
        for (const attributeName in attributeSchemas) {
            const driverAttributeSchema: GrpcAttributeSchema =
                attributeSchemas[attributeName]
            attributesSchemas.push(
                this.convertAttributeSchema(driverAttributeSchema)
            )
        }
        return attributesSchemas
    }

    private convertAssociatedDataSchemas(associatedDataSchemas: {
        [key: string]: GrpcAssociatedDataSchema
    }): AssociatedDataSchema[] {
        const newAssociatedDataSchemas: AssociatedDataSchema[] = []
        for (const associatedDataName in associatedDataSchemas) {
            const driverAssociatedDataSchema: GrpcAssociatedDataSchema =
                associatedDataSchemas[associatedDataName]
            newAssociatedDataSchemas.push(
                this.convertAssociatedDataSchema(driverAssociatedDataSchema)
            )
        }
        return newAssociatedDataSchemas
    }

    private convertAssociatedDataSchema(
        associatedDataSchema: GrpcAssociatedDataSchema
    ): AssociatedDataSchema {
        return new AssociatedDataSchema(
            associatedDataSchema.name,
            MapUtil.getNamingMap(associatedDataSchema.nameVariant),
            associatedDataSchema.description,
            associatedDataSchema.deprecationNotice,
            ScalarConverter.convertAssociatedDataScalar(associatedDataSchema.type),
            associatedDataSchema.nullable,
            associatedDataSchema.localized
        )
    }

    private convertLocales(locales: GrpcLocale[]): Locale[] {
        const convertedLocales: Locale[] = []
        for (const locale of locales) {
            convertedLocales.push(new Locale(locale.languageTag))
        }
        return convertedLocales
    }

    private convertSortableAttributeCompoundSchemas(sortableAttributeCompoundSchemas: {
        [key: string]: GrpcSortableAttributeCompoundSchema
    }): SortableAttributeCompoundSchema[] {
        const sortableAttributeSchemas: SortableAttributeCompoundSchema[] = []
        for (const compoundName in sortableAttributeCompoundSchemas) {
            const driverSortableAttributeCompoundSchema: GrpcSortableAttributeCompoundSchema =
                sortableAttributeCompoundSchemas[compoundName]
            sortableAttributeSchemas.push(
                this.convertSortableAttributeCompoundSchema(
                    driverSortableAttributeCompoundSchema
                )
            )
        }
        return sortableAttributeSchemas
    }

    private convertCurrency(currencies: GrpcCurrency[]): Currency[] {
        const convertedCurrencies: Currency[] = []
        for (const currency of currencies) {
            convertedCurrencies.push(new Currency(currency.code))
        }
        return convertedCurrencies
    }

    private convertEvolutionMode(
        evolutionModes: GrpcEvolutionMode[]
    ): EvolutionMode[] {
        const newEvolutionModes: EvolutionMode[] = []
        for (const grpcEvolutionMode of evolutionModes) {
            switch (grpcEvolutionMode) {
                case GrpcEvolutionMode.ADAPT_PRIMARY_KEY_GENERATION:
                    newEvolutionModes.push(
                        EvolutionMode.AdaptPrimaryKeyGeneration
                    )
                    break
                case GrpcEvolutionMode.ADDING_ATTRIBUTES:
                    newEvolutionModes.push(EvolutionMode.AddingAttributes)
                    break
                case GrpcEvolutionMode.ADDING_ASSOCIATED_DATA:
                    newEvolutionModes.push(EvolutionMode.AddingAssociatedData)
                    break
                case GrpcEvolutionMode.ADDING_REFERENCES:
                    newEvolutionModes.push(EvolutionMode.AddingReferences)
                    break
                case GrpcEvolutionMode.ADDING_PRICES:
                    newEvolutionModes.push(EvolutionMode.AddingPrices)
                    break
                case GrpcEvolutionMode.ADDING_LOCALES:
                    newEvolutionModes.push(EvolutionMode.AddingLocales)
                    break
                case GrpcEvolutionMode.ADDING_CURRENCIES:
                    newEvolutionModes.push(EvolutionMode.AddingCurrencies)
                    break
                case GrpcEvolutionMode.ADDING_HIERARCHY:
                    newEvolutionModes.push(EvolutionMode.AddingHierarchy)
                    break
                default:
                    throw new UnexpectedError(
                        `Could not convert evolution mode '${grpcEvolutionMode}'.`
                    )
            }
        }
        return newEvolutionModes
    }

    private convertOrderBehaviour(
        orderBehaviour: GrpcOrderBehaviour
    ): OrderBehaviour {
        switch (orderBehaviour) {
            case GrpcOrderBehaviour.NULLS_FIRST:
                return OrderBehaviour.NullsFirst
            case GrpcOrderBehaviour.NULLS_LAST:
                return OrderBehaviour.NullsLast
            default:
                throw new UnexpectedError(
                    `Unsupported order behaviour '${orderBehaviour}'.`
                )
        }
    }

    private convertCardinality(cardinality: GrpcCardinality): Cardinality {
        switch (cardinality) {
            case GrpcCardinality.EXACTLY_ONE:
                return Cardinality.ExactlyOne
            case GrpcCardinality.ONE_OR_MORE:
                return Cardinality.OneOrMore
            case GrpcCardinality.ZERO_OR_MORE:
                return Cardinality.ZeroOrMore
            case GrpcCardinality.ZERO_OR_ONE:
                return Cardinality.ZeroOrOne
            default:
                throw new UnexpectedError(
                    `Unsupported cardinality '${cardinality}'.`
                )
        }
    }

    private convertOrderDirection(
        orderDirection: GrpcOrderDirection
    ): OrderDirection {
        switch (orderDirection) {
            case GrpcOrderDirection.ASC:
                return OrderDirection.Desc
            case GrpcOrderDirection.DESC:
                return OrderDirection.Desc
            default:
                throw new UnexpectedError(
                    `Unsupported order direction '${orderDirection}'.`
                )
        }
    }
}
