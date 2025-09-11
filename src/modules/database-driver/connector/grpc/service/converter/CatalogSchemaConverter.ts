import type {
    GrpcCatalogSchema,
    GrpcGlobalAttributeSchema,
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchema_pb'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { GlobalAttributeSchema } from '@/modules/database-driver/request-response/schema/GlobalAttributeSchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import {
    GrpcAttributeInheritanceBehavior,
    GrpcAttributeSchemaType,
    GrpcCardinality,
    GrpcEvolutionMode,
    GrpcOrderBehaviour,
    GrpcOrderDirection, GrpcReferenceIndexType
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import { EvolutionMode } from '@/modules/database-driver/request-response/schema/EvolutionMode'
import { OrderBehaviour } from '@/modules/database-driver/request-response/schema/OrderBehaviour'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'
import type {
    GrpcAssociatedDataSchema,
    GrpcAttributeElement,
    GrpcAttributeSchema,
    GrpcEntitySchema,
    GrpcReferenceSchema,
    GrpcSortableAttributeCompoundSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb'
import type {
    GrpcCurrency,
    GrpcLocale,
    GrpcScopedReferenceIndexType
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import {
    AttributeElement,
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { ScalarConverter } from './ScalarConverter'
import { EvitaValueConverter } from './EvitaValueConverter'
import type { EntitySchemaAccessor } from '@/modules/database-driver/request-response/schema/EntitySchemaAccessor'
import { MapUtil } from '@/modules/database-driver/connector/grpc/utils/MapUtil'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { List as ImmutableList } from 'immutable'
import {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/ScopedReferenceIndexType.ts'
import { ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'
import { ReflectedReferenceSchema } from '@/modules/database-driver/request-response/schema/ReflectedReferenceSchema.ts'
import {
    AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'
import { ScopesConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScopesConverter.ts'


export class CatalogSchemaConverter {

    // todo pfi: remove constructor
    constructor(evitaValueConverter: EvitaValueConverter, scopesConverter: ScopesConverter) {
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
        if (attribute.schemaType === GrpcAttributeSchemaType.ENTITY_SCHEMA) {
            return new AttributeSchema(
                attribute.name,
                nameVariants,
                attribute.description ?? undefined,
                attribute.deprecationNotice ?? undefined,
                scalar,
                attribute.nullable,
                EvitaValueConverter.convertGrpcValue(
                    attribute.defaultValue,
                    attribute.defaultValue?.value.case
                ),
                attribute.localized,
                attribute.indexedDecimalPlaces,
                ScopesConverter.convertEntityScopes(attribute.sortableInScopes),
                ScopesConverter.convertEntityScopes(attribute.filterableInScopes),
                ScopesConverter.convertUniqueInScopes(attribute.uniqueInScopes)
            )
        } else if (attribute.schemaType === GrpcAttributeSchemaType.REFERENCE_SCHEMA) {
            return new EntityAttributeSchema(
                attribute.name,
                nameVariants,
                attribute.description,
                attribute.deprecationNotice,
                scalar,
                attribute.nullable,
                EvitaValueConverter.convertGrpcValue(
                    attribute.defaultValue,
                    attribute.defaultValue?.value.case
                ),
                attribute.localized,
                attribute.indexedDecimalPlaces,
                attribute.representative,
                ScopesConverter.convertEntityScopes(attribute.sortableInScopes),
                ScopesConverter.convertEntityScopes(attribute.filterableInScopes),
                ScopesConverter.convertUniqueInScopes(attribute.uniqueInScopes)
            )
        } else if (attribute.schemaType === GrpcAttributeSchemaType.GLOBAL_SCHEMA) {
            return new GlobalAttributeSchema(
                attribute.name,
                MapUtil.getNamingMap(attribute.nameVariant),
                attribute.description,
                attribute.deprecationNotice,
                ScalarConverter.convertScalar(attribute.type),
                attribute.nullable,
                EvitaValueConverter.convertGrpcValue(
                    attribute.defaultValue,
                    attribute.defaultValue?.value.case
                ),
                attribute.localized,
                attribute.indexedDecimalPlaces,
                attribute.representative,
                ScopesConverter.convertEntityScopes(attribute.sortableInScopes),
                ScopesConverter.convertEntityScopes(attribute.filterableInScopes),
                ScopesConverter.convertUniqueGloballyInScopes(attribute.uniqueGloballyInScopes),
                ScopesConverter.convertUniqueInScopes(attribute.uniqueInScopes),
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
            globalAttributeSchema.nullable,
            EvitaValueConverter.convertGrpcValue(
                globalAttributeSchema.defaultValue,
                globalAttributeSchema.defaultValue?.value.case
            ),
            globalAttributeSchema.localized,
            globalAttributeSchema.indexedDecimalPlaces,
            globalAttributeSchema.representative,
            ScopesConverter.convertEntityScopes(globalAttributeSchema.sortableInScopes),
            ScopesConverter.convertEntityScopes(globalAttributeSchema.filterableInScopes),
            ScopesConverter.convertUniqueGloballyInScopes(globalAttributeSchema.uniqueGloballyInScopes),
            ScopesConverter.convertUniqueInScopes(globalAttributeSchema.uniqueInScopes)
        )
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
            CatalogSchemaConverter.convertLocales(entitySchema.locales),
            CatalogSchemaConverter.convertCurrency(entitySchema.currencies),
            CatalogSchemaConverter.convertEvolutionMode(entitySchema.evolutionMode),
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

    private convertAttributeInheritanceBehavior(attributeInheritanceBehavior: GrpcAttributeInheritanceBehavior) {
        if(attributeInheritanceBehavior === GrpcAttributeInheritanceBehavior.INHERIT_ALL_EXCEPT)
            return AttributeInheritanceBehavior.InheritAllExcept
        else if(attributeInheritanceBehavior === GrpcAttributeInheritanceBehavior.INHERIT_ONLY_SPECIFIED)
            return AttributeInheritanceBehavior.InheritOnlySpecified
        else
            throw new UnexpectedError('Unavailable attribute inheritance behavior')
    }

    private convertReferenceSchema(
        referenceSchema: GrpcReferenceSchema
    ): ReferenceSchema {
        if(referenceSchema.reflectedReferenceName != undefined) {
            return new ReflectedReferenceSchema(
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
                this.convertCardinality(referenceSchema.cardinality),
                this.convertAttributeSchemas(referenceSchema.attributes),
                this.convertSortableAttributeCompoundSchemas(
                    referenceSchema.sortableAttributeCompounds
                ),
                this.convertScopedIndexTypes(referenceSchema.scopedIndexTypes),
                ScopesConverter.convertEntityScopes(referenceSchema.facetedInScopes),
                referenceSchema.reflectedReferenceName,
                referenceSchema.descriptionInherited,
                referenceSchema.deprecationNoticeInherited,
                referenceSchema.cardinalityInherited,
                referenceSchema.facetedInherited,
                referenceSchema.indexedInherited,
                this.convertAttributeInheritanceBehavior(referenceSchema.attributeInheritanceBehavior),
                referenceSchema.attributeInheritanceFilter
            )
        } else {
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
                this.convertCardinality(referenceSchema.cardinality),
                this.convertAttributeSchemas(referenceSchema.attributes),
                this.convertSortableAttributeCompoundSchemas(
                    referenceSchema.sortableAttributeCompounds
                ),
                this.convertScopedIndexTypes(referenceSchema.scopedIndexTypes),
                ScopesConverter.convertEntityScopes(referenceSchema.facetedInScopes)
            )
        }
    }

    private convertScopedIndexTypes(scopeType: GrpcScopedReferenceIndexType[]): ImmutableList<ScopedReferenceIndexType> {
        const items:ScopedReferenceIndexType[] = []
        for (const index of scopeType) {
            items.push(this.convertScopedIndexType(index))
        }

        return ImmutableList(items)
    }

    private convertScopedIndexType(scopedIndexType: GrpcScopedReferenceIndexType): ScopedReferenceIndexType {
        return new ScopedReferenceIndexType(
            ScopesConverter.convertEntityScope(scopedIndexType.scope),
            this.convertReferenceIndexType(scopedIndexType.indexType)
        )
    }

    private convertReferenceIndexType(indexType: GrpcReferenceIndexType): ReferenceIndexType {
        switch (indexType) {
            case GrpcReferenceIndexType.REFERENCE_INDEX_TYPE_NONE:
                return ReferenceIndexType.ReferenceIndexTypeNone
            case GrpcReferenceIndexType.REFERENCE_INDEX_TYPE_FOR_FILTERING:
                return ReferenceIndexType.ReferenceIndexTypeForFiltering
            case GrpcReferenceIndexType.REFERENCE_INDEX_TYPE_FOR_FILTERING_AND_PARTITIONING:
                return ReferenceIndexType.ReferenceIndexTypeForFilteringAndPartitioning
        }
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
            ScalarConverter.convertAssociatedDataScalar(
                associatedDataSchema.type
            ),
            associatedDataSchema.nullable,
            associatedDataSchema.localized
        )
    }

    static convertLocales(locales: GrpcLocale[]): Locale[] {
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

    static convertCurrency(currencies: GrpcCurrency[]): Currency[] {
        const convertedCurrencies: Currency[] = []
        for (const currency of currencies) {
            convertedCurrencies.push(new Currency(currency.code))
        }
        return convertedCurrencies
    }

    static convertEvolutionMode(
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
