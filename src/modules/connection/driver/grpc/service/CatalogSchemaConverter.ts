import {
    GrpcCatalogSchema,
    GrpcGlobalAttributeSchema
} from '@/modules/connection/driver/grpc/gen/GrpcCatalogSchema_pb'
import { CatalogSchema } from '@/modules/connection/model/schema/CatalogSchema'
import { Value } from '@/modules/connection/model/Value'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { Map, List } from 'immutable'
import { GlobalAttributeSchema } from '@/modules/connection/model/schema/GlobalAttributeSchema'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import {
    GrpcAttributeSchemaType,
    GrpcAttributeUniquenessType,
    GrpcCardinality,
    GrpcEvolutionMode,
    GrpcGlobalAttributeUniquenessType,
    GrpcOrderBehaviour,
    GrpcOrderDirection
} from '@/modules/connection/driver/grpc/gen/GrpcEnums_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { GlobalAttributeUniquenessType } from '@/modules/connection/model/schema/GlobalAttributeUniquenessType'
import { EntityAttributeSchema } from '@/modules/connection/model/schema/EntityAttributeSchema'
import { EvolutionMode } from '@/modules/connection/model/schema/EvolutionMode'
import { AttributeUniquenessType } from '@/modules/connection/model/schema/AttributeUniquenessType'
import { OrderBehaviour } from '@/modules/connection/model/schema/OrderBehaviour'
import { Cardinality } from '@/modules/connection/model/schema/Cardinality'
import { OrderDirection } from '@/modules/connection/model/schema/OrderDirection'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import {
    GrpcAssociatedDataSchema,
    GrpcAttributeElement,
    GrpcAttributeSchema,
    GrpcEntitySchema,
    GrpcReferenceSchema,
    GrpcSortableAttributeCompoundSchema
} from '@/modules/connection/driver/grpc/gen/GrpcEntitySchema_pb'
import {
    GrpcCurrency,
    GrpcLocale
} from '@/modules/connection/driver/grpc/gen/GrpcEvitaDataTypes_pb'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import {
    AttributeElement,
    SortableAttributeCompoundSchema
} from '@/modules/connection/model/schema/SortableAttributeCompoundSchema'
import { AssociatedDataSchema } from '@/modules/connection/model/schema/AssociatedDataSchema'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { ScalarConverter } from './ScalarConverter'
import { MapUtil } from '../utils/MapUtil'
import { EvitaValueConverter } from './EvitaValueConverter'
import { Currency } from '@/modules/connection/model/data-type/Currency'

//TODO: Add documentation
export class CatalogSchemaConverter {
    private readonly evitaValueConverter:EvitaValueConverter

    constructor(evitaValueConverter: EvitaValueConverter){
        this.evitaValueConverter = evitaValueConverter
    }

    convert(
        catalogSchema: GrpcCatalogSchema,
        entitySchemaAccessor: (
            catalogName: string
        ) => Promise<Value<List<EntitySchema>>>
    ): CatalogSchema {
        return new CatalogSchema(
            Value.of(catalogSchema.version),
            catalogSchema.name,
            Value.of(
                MapUtil.getNamingMap(catalogSchema.nameVariant)
            ),
            Value.of(catalogSchema.description || null),
            Value.of(
                this.convertGlobalAttributeSchemas(catalogSchema.attributes)
            ),
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
                Value.of(
                    nameVariants
                ),
                Value.of(attribute.description ?? undefined),
                Value.of(attribute.deprecationNotice ?? undefined),
                Value.of(scalar),
                Value.of(uniquenessType),
                Value.of(attribute.filterable),
                Value.of(attribute.sortable),
                Value.of(attribute.nullable),
                Value.of(this.evitaValueConverter.convert(attribute.defaultValue)),
                Value.of(attribute.localized),
                Value.of(attribute.indexedDecimalPlaces)
            )
        } else if (attribute.schemaType === GrpcAttributeSchemaType.REFERENCE) {
            return new EntityAttributeSchema(
                attribute.name,
                Value.of(
                    nameVariants
                ),
                Value.of(attribute.description),
                Value.of(attribute.deprecationNotice),
                Value.of(scalar),
                Value.of(uniquenessType),
                Value.of(attribute.filterable),
                Value.of(attribute.sortable),
                Value.of(attribute.nullable),
                Value.of(this.evitaValueConverter.convert(attribute.defaultValue)),
                Value.of(attribute.localized),
                Value.of(attribute.indexedDecimalPlaces),
                Value.of(attribute.representative)
            )
        } else {
            throw new UnexpectedError('Unaccepted type')
        }
    }

    private convertGlobalAttributeSchema(
        globalAttributeSchema: GrpcGlobalAttributeSchema
    ): AttributeSchema {
        const name: string = globalAttributeSchema.name
        const nameVariants: Value<Map<NamingConvention, string>> = Value.of(
            MapUtil.getNamingMap(globalAttributeSchema.nameVariant)
        )

        const description: Value<string | undefined> = Value.of(
            globalAttributeSchema.description
        )
        const deprecationNotice: Value<string | undefined> = Value.of(
            globalAttributeSchema.deprecationNotice
        )
        const type: Value<Scalar> = Value.of(
            ScalarConverter.convertScalar(globalAttributeSchema.type)
        )
        const uniquenessType: Value<AttributeUniquenessType> = Value.of(
            this.convertAttributeUniquenessType(globalAttributeSchema.unique)
        )
        const filterable: Value<boolean> = Value.of(
            globalAttributeSchema.filterable
        )
        const sortable: Value<boolean> = Value.of(
            globalAttributeSchema.sortable
        )
        const nullable: Value<boolean> = Value.of(
            globalAttributeSchema.nullable
        )

        const defaultValue: Value<any | any[] | null> = Value.of(
            this.evitaValueConverter.convert(globalAttributeSchema.defaultValue)
        )
        const localized: Value<boolean> = Value.of(
            globalAttributeSchema.localized
        )
        const indexedDecimalPlaces: Value<number> = Value.of(
            globalAttributeSchema.indexedDecimalPlaces
        )

        const representative: Value<any> = Value.of(
            globalAttributeSchema.representative
        )
        const uniqueGloballyType: Value<GlobalAttributeUniquenessType> =
            Value.of(
                this.convertGlobalAttributeUniquenessType(
                    globalAttributeSchema.uniqueGlobally
                )
            )
        return new GlobalAttributeSchema(
            name,
            nameVariants,
            description,
            deprecationNotice,
            type,
            uniquenessType,
            filterable,
            sortable,
            nullable,
            defaultValue,
            localized,
            indexedDecimalPlaces,
            representative,
            uniqueGloballyType
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
            Value.of(entitySchema.version),
            entitySchema.name,
            Value.of(
                MapUtil.getNamingMap(entitySchema.nameVariant)
            ),
            Value.of(entitySchema.description || undefined),
            Value.of(entitySchema.deprecationNotice || undefined),
            Value.of(entitySchema.withGeneratedPrimaryKey),
            Value.of(entitySchema.withHierarchy),
            Value.of(entitySchema.withPrice),
            Value.of(entitySchema.indexedPricePlaces),
            Value.of(this.convertLocales(entitySchema.locales)),
            Value.of(this.convertCurrency(entitySchema.currencies)),
            Value.of(this.convertEvolutionMode(entitySchema.evolutionMode)),
            Value.of(
                this.convertEntityAttributeSchemas(entitySchema.attributes)
            ),
            Value.of(
                this.convertSortableAttributeCompoundSchemas(
                    entitySchema.sortableAttributeCompounds
                )
            ),
            Value.of(
                this.convertAssociatedDataSchemas(entitySchema.associatedData)
            ),
            Value.of(this.convertReferenceSchemas(entitySchema.references))
        )
    }

    private convertSortableAttributeCompoundSchema(
        sortableAttributeCompoundSchema: GrpcSortableAttributeCompoundSchema
    ): SortableAttributeCompoundSchema {
        return new SortableAttributeCompoundSchema(
            sortableAttributeCompoundSchema.name,
            Value.of(
                MapUtil.getNamingMap(sortableAttributeCompoundSchema.nameVariant)
            ),
            Value.of(sortableAttributeCompoundSchema.description || null),
            Value.of(sortableAttributeCompoundSchema.deprecationNotice || null),
            Value.of(
                this.convertAttributeElements(
                    sortableAttributeCompoundSchema.attributeElements
                )
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
            Value.of(attributeElement.attributeName),
            Value.of(this.convertOrderBehaviour(attributeElement.behaviour)),
            Value.of(this.convertOrderDirection(attributeElement.direction))
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
                this.convertGlobalAttributeSchema(
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
            Value.of(
                MapUtil.getNamingMap(referenceSchema.nameVariant)
            ),
            Value.of(referenceSchema.description || undefined),
            Value.of(referenceSchema.deprecationNotice || undefined),
            Value.of(referenceSchema.entityType),
            Value.of(referenceSchema.referencedEntityTypeManaged),
            Value.of(
                MapUtil.getNamingMap(referenceSchema.entityTypeNameVariant)
            ),
            Value.of(referenceSchema.groupType),
            Value.of(referenceSchema.referencedGroupTypeManaged),
            Value.of(MapUtil.getNamingMap(referenceSchema.groupTypeNameVariant)),
            Value.of(referenceSchema.indexed),
            Value.of(referenceSchema.faceted),
            Value.of(this.convertCardinality(referenceSchema.cardinality)),
            Value.of(this.convertAttributeSchemas(referenceSchema.attributes)),
            Value.of(
                this.convertSortableAttributeCompoundSchemas(
                    referenceSchema.sortableAttributeCompounds
                )
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
            Value.of(
                MapUtil.getNamingMap(associatedDataSchema.nameVariant)
            ),
            Value.of(associatedDataSchema.description || null),
            Value.of(associatedDataSchema.deprecationNotice || null),
            Value.of(
                ScalarConverter.convertAssociatedDataScalar(associatedDataSchema.type)
            ),
            Value.of(associatedDataSchema.nullable),
            Value.of(associatedDataSchema.localized)
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
