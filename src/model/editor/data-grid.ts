import { EvitaDBConnection, EvitaDBConnectionId, QueryLanguage, UnexpectedError } from '@/model/lab'
import {
    CatalogPointer,
    ExecutableTabRequest, SerializableTabRequestComponentData, SerializableTabRequestComponentParams,
    TabRequestComponentData, TabRequestComponentDataDto,
    TabRequestComponentParams, TabRequestComponentParamsDto
} from '@/model/editor/editor'
import { LabService } from '@/services/lab.service'
import { BigDecimal, DateTime, Long, QueryPriceMode, Range } from '@/model/evitadb'
import { InjectionKey, Ref } from 'vue'

/**
 * Represents props of the LabEditorDataGrid component.
 */
export class DataGridParams extends SerializableTabRequestComponentParams<DataGridParamsDto> implements TabRequestComponentParams, ExecutableTabRequest {
    readonly dataPointer: DataGridDataPointer
    readonly executeOnOpen: boolean

    constructor(dataPointer: DataGridDataPointer, executeOnOpen: boolean = false) {
        super()
        this.dataPointer = dataPointer
        this.executeOnOpen = executeOnOpen
    }

    static restoreFromSerializable(labService: LabService, json: TabRequestComponentParamsDto): DataGridParams {
        const dto: DataGridParamsDto = json as DataGridParamsDto
        return new DataGridParams(
            new DataGridDataPointer(
                labService.getConnection(dto.connectionId),
                dto.catalogName,
                dto.entityType
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    toSerializable(): DataGridParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            catalogName: this.dataPointer.catalogName,
            entityType: this.dataPointer.entityType
        }
    }
}

/**
 * Serializable DTO for storing {@link DataGridParams} in a storage or link.
 */
interface DataGridParamsDto extends TabRequestComponentParamsDto {
    readonly connectionId: EvitaDBConnectionId
    readonly catalogName: string
    readonly entityType: string
}

/**
 * Represents injectable/storable user data of the LabEditorConsoleDataGrid component.
 */
export class DataGridData extends SerializableTabRequestComponentData<DataGridDataDto> implements TabRequestComponentData {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly dataLocale?: string
    readonly priceType?: QueryPriceMode
    readonly displayedProperties?: EntityPropertyKey[]
    readonly pageSize?: number
    readonly pageNumber?: number

    constructor(queryLanguage?: QueryLanguage,
                filterBy?: string,
                orderBy?: string,
                dataLocale?: string,
                displayedProperties?: EntityPropertyKey[],
                pageSize?: number,
                pageNumber?: number) {
        super()
        this.queryLanguage = queryLanguage
        this.filterBy = filterBy
        this.orderBy = orderBy
        this.dataLocale = dataLocale
        this.displayedProperties = displayedProperties
        this.pageSize = pageSize
        this.pageNumber = pageNumber
    }

    static restoreFromSerializable(json: TabRequestComponentDataDto): DataGridData {
        const dto: DataGridDataDto = json as DataGridDataDto
        return new DataGridData(
            dto.queryLanguage,
            dto.filterBy,
            dto.orderBy,
            dto.dataLocale,
            dto.displayedProperties?.map((key: string) => EntityPropertyKey.fromString(key)),
            dto.pageSize,
            dto.pageNumber
        )
    }

    toSerializable(): DataGridDataDto {
        return {
            queryLanguage: this.queryLanguage,
            filterBy: this.filterBy,
            orderBy: this.orderBy,
            dataLocale: this.dataLocale,
            displayedProperties: this.displayedProperties?.map(key => key.toString()),
            pageSize: this.pageSize,
            pageNumber: this.pageNumber
        }
    }
}

/**
 * Serializable DTO for storing {@link DataGridData} in a storage or link.
 */
interface DataGridDataDto extends TabRequestComponentDataDto {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly dataLocale?: string
    readonly displayedProperties?: string[]
    readonly pageSize?: number
    readonly pageNumber?: number
}

/**
 * Points to concrete evitaDB collection to fetch data from.
 */
export class DataGridDataPointer extends CatalogPointer {
    readonly entityType: string

    constructor(connection: EvitaDBConnection, catalogName: string, entityType: string) {
        super(connection, catalogName)
        this.entityType = entityType
    }
}

/**
 * Dependency injection key for data grid parameters
 */
export const gridParamsKey = Symbol('gridParams') as InjectionKey<DataGridParams>
/**
 * Dependency injection key for index of available entity property descriptors
 */
export const entityPropertyDescriptorIndexKey = Symbol('entityPropertyDescriptorIndex') as InjectionKey<Ref<Map<string, EntityPropertyDescriptor>>>
/**
 * Dependency injection key for selected query language
 */
export const queryLanguageKey = Symbol('queryLanguage') as InjectionKey<Ref<QueryLanguage | undefined>>
/**
 * Dependency injection key for selected data locale
 */
export const dataLocaleKey = Symbol('dataLocale') as InjectionKey<Ref<string | undefined>>
/**
 * Dependency injection key for selected price type
 */
export const priceTypeKey = Symbol('priceType') as InjectionKey<Ref<QueryPriceMode | undefined>>
/**
 * Dependency injection key for used filter
 */
export const queryFilterKey = Symbol('queryFilter') as InjectionKey<Ref<string | undefined>>
/**
 * Dependency injection key for selected entity from the grid
 */
export const selectedEntityKey = Symbol('selectedEntity') as InjectionKey<FlatEntity>
/**
 * Dependency injection key for single entity property descriptor
 */
// todo we could have useEntityPropertyDescriptor() and provideEntityPropertyDescriptor() to avoid the need of this key
//  like it is done for services
//  also the mandatory/optional could be resolved here in single place and not in different components
//  also each key could have single file
export const entityPropertyDescriptorKey = Symbol('entityPropertyDescriptor') as InjectionKey<EntityPropertyDescriptor | undefined>

/**
 * Types of entity properties with their prefixes
 */
export enum EntityPropertyType {
    Entity = '',
    Attributes = 'attributes',
    AssociatedData = 'associatedData',
    References = 'references',
    ReferenceAttributes = 'referenceAttributes',
    Prices = 'prices'
}

/**
 * Defines a parent property type for a given entity property type that cannot be used by itself without its parent.
 * Note: this is a workaround for the fact that we cannot define metadata for individual enum values.
 */
export const parentEntityPropertyType: Map<EntityPropertyType, EntityPropertyType> = new Map([
    [EntityPropertyType.ReferenceAttributes, EntityPropertyType.References]
])

/**
 * Set of statically defined entity properties.
 */
export enum StaticEntityProperties {
    PrimaryKey = 'primaryKey',
    ParentPrimaryKey = 'parentPrimaryKey',
    Locales = 'locales',
    AllLocales = 'allLocales',
    PriceInnerRecordHandling = 'priceInnerRecordHandling'
}

/**
 * List of {@link StaticEntityProperties} that are sortable.
 */
export const sortableStaticEntityProperties: string[] = [StaticEntityProperties.PrimaryKey]

/**
 * Extension of the core evitaDB's {@link Scalar} enum with complex entity objects that we support in grid detail view
 * with the scalars.
 */
export enum ExtraEntityObjectType {
    Prices = 'prices',
    ReferenceAttributes = 'referenceAttributes'
}

/**
 * Full description of a single entity property
 */
export class EntityPropertyDescriptor {
    readonly type: EntityPropertyType
    readonly key: EntityPropertyKey
    readonly title: string
    readonly flattenedTitle: string
    readonly parentSchema: any | undefined
    readonly schema: any | undefined
    readonly children: EntityPropertyDescriptor[]

    constructor(type: EntityPropertyType,
                key: EntityPropertyKey,
                title: string,
                flattenedTitle: string,
                parentSchema: any | undefined,
                schema: any | undefined,
                children: EntityPropertyDescriptor[]) {
        this.type = type
        this.key = key
        this.title = title
        this.flattenedTitle = flattenedTitle
        this.parentSchema = parentSchema
        this.schema = schema
        this.children = children
    }

    isSortable(): boolean {
        return sortableStaticEntityProperties.includes(this.key.toString()) || this.schema?.sortable || false
    }

    isLocalized(): boolean {
        return this.schema?.localized || false
    }
}

/**
 * Summarizes the selection state of all properties in a single section.
 */
export enum EntityPropertySectionSelection {
    None = 'none',
    Some = 'some',
    All = 'all'
}

/**
 * Represents key of a single typed entity property.
 */
export class EntityPropertyKey {
    static readonly entityPropertyPartSeparator: string = ':'

    readonly type: EntityPropertyType
    readonly names: string[]
    get parentName(): string {
        if (this.names.length < 2) {
            throw new UnexpectedError(undefined, `Parent name of entity property for type ${this.type} is not supported`)
        }
        return this.names[0]
    }
    get name(): string {
        if (this.names.length === 0) {
            throw new UnexpectedError(undefined, `Name of entity property for type ${this.type} is not supported`)
        }
        return this.names.at(-1)!
    }

    private constructor(type: EntityPropertyType, names: string[] = []) {
        this.type = type
        if (names.length > 2) {
            throw new UnexpectedError(undefined, `Cannot create entity property key with more than two names: ${names}`)
        }
        this.names = names
    }

    static entity(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Entity, [name])
    }

    static attributes(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Attributes, [name])
    }

    static associatedData(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.AssociatedData, [name])
    }

    static prices(): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Prices)
    }

    static references(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.References, [name])
    }

    static referenceAttributes(referenceName: string, attributeName: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.ReferenceAttributes, [referenceName, attributeName])
    }

    static fromString(propertyKey: string): EntityPropertyKey {
        const parts = propertyKey.split(EntityPropertyKey.entityPropertyPartSeparator)

        if (parts[0] === EntityPropertyType.Attributes) {
            return new EntityPropertyKey(EntityPropertyType.Attributes, parts.slice(1))
        } else if (parts[0] === EntityPropertyType.AssociatedData) {
            return new EntityPropertyKey(EntityPropertyType.AssociatedData, parts.slice(1))
        } else if (parts[0] === EntityPropertyType.References) {
            return new EntityPropertyKey(EntityPropertyType.References, parts.slice(1))
        } else if (parts[0] === EntityPropertyType.ReferenceAttributes) {
            return new EntityPropertyKey(EntityPropertyType.ReferenceAttributes, parts.slice(1))
        } else {
            return new EntityPropertyKey(EntityPropertyType.Entity, parts)
        }
    }

    supportsName(): boolean {
        return this.names.length > 0
    }

    toString(): string {
        if (this.type === EntityPropertyType.Entity) {
            return this.names.join(EntityPropertyKey.entityPropertyPartSeparator)
        }
        if (this.names.length === 0) {
            return this.type
        }
        return `${this.type}${EntityPropertyKey.entityPropertyPartSeparator}${this.names.join(EntityPropertyKey.entityPropertyPartSeparator)}`
    }
}

/**
 * Represents a single entity property value. It can be a wrapped scalar value or a custom object that needs special handling.
 */
export abstract class EntityPropertyValue {
    protected readonly emptyEntityPropertyValuePlaceholder: string = '<null>'

    protected constructor() {
    }

    /**
     * Returns the raw value of the entity property value.
     */
    abstract value(): any | any[] | undefined

    /**
     * Returns true if the raw entity property value is missing.
     */
    abstract isEmpty(): boolean

    /**
     * Returns a preview string representation of the entity property value. The method accepts context object
     * that can be used to influence the output.
     */
    abstract toPreviewString(context?: EntityPropertyValuePreviewStringContext): string
}

/**
 * Passes context arguments to {@link EntityPropertyValue.toPreviewString} method to possibly influence the output.
 */
export type EntityPropertyValuePreviewStringContext = {
    priceType?: QueryPriceMode
}

/**
 * Represents a single entity property value that is a scalar (native to JavaScript). Cannot be an array, each array item
 * must be wrapped in a separate {@link NativeValue} instance.
 */
export class NativeValue extends EntityPropertyValue {
    readonly delegate: string | DateTime | BigDecimal | Long | number | object | boolean | undefined | Range<any>

    constructor(delegate: string | DateTime | BigDecimal | Long | number | object | boolean | undefined | Range<any>) {
        super()
        this.delegate = delegate
    }

    value(): string | DateTime | BigDecimal | Long | number | object | boolean | undefined | Range<any> {
        return this.delegate
    }

    isEmpty(): boolean {
        return this.delegate == undefined
    }

    toPreviewString(): string {
        if (this.delegate === undefined) {
            return super.emptyEntityPropertyValuePlaceholder
        } else if (this.delegate instanceof Array) {
            return JSON.stringify(this.delegate)
        } else if (this.delegate instanceof Object) {
            return JSON.stringify(this.delegate)
        } else {
            return this.delegate.toString()
        }
    }
}

/**
 * Represents a pointer to a referenced entity in another grid.
 */
export class EntityReferenceValue extends EntityPropertyValue {
    readonly primaryKey: number
    readonly representativeAttributes: EntityPropertyValue[]

    constructor(primaryKey: number, representativeAttributes: EntityPropertyValue[]) {
        super()
        this.primaryKey = primaryKey
        this.representativeAttributes = representativeAttributes
    }

    value(): any {
        return this
    }

    isEmpty(): boolean {
        return false
    }

    toPreviewString(): string {
        const flattenedRepresentativeAttributes: string[] = []
        for (const representativeAttribute of this.representativeAttributes) {
            const representativeAttributeValue = representativeAttribute.value()
            if (representativeAttributeValue == undefined) {
                return super.emptyEntityPropertyValuePlaceholder
            } else {
                flattenedRepresentativeAttributes.push(representativeAttributeValue.toString())
            }
        }
        if (flattenedRepresentativeAttributes.length === 0) {
            return `${this.primaryKey}`
        } else {
            return `${this.primaryKey}: ${flattenedRepresentativeAttributes.join(', ')}`
        }
    }
}

/**
 * Holder for entity prices displayable data grid.
 */
export class EntityPrices extends EntityPropertyValue {
    readonly priceForSale?: EntityPrice
    readonly prices: EntityPrice[]

    constructor(priceForSale: EntityPrice | undefined, prices: EntityPrice[]) {
        super()
        this.priceForSale = priceForSale
        this.prices = prices
    }

    count(): number {
        return this.prices.length
    }

    value(): any {
        return this
    }

    isEmpty(): boolean {
        return false
    }

    toPreviewString(context?: EntityPropertyValuePreviewStringContext): string {
        let previewString: string = ''

        if (this.priceForSale != undefined) {
            const priceFormatter = new Intl.NumberFormat(
                navigator.language,
                { style: 'currency', currency: this.priceForSale.currency, maximumFractionDigits: 2 }
            )
            const actualPriceType: QueryPriceMode = context?.priceType != undefined ? context.priceType : QueryPriceMode.WithTax
            const price: BigDecimal = actualPriceType === QueryPriceMode.WithTax ? this.priceForSale.priceWithTax : this.priceForSale.priceWithoutTax
            const formattedPrice: string = priceFormatter.format(parseFloat(price))

            previewString += `${formattedPrice} with `
        }

        const allPricesCount = this.count()
        previewString += (allPricesCount === 1 ? `${allPricesCount} price` : `${allPricesCount} prices`)

        return previewString
    }
}

/**
 * Represents a single entity price.
 */
export class EntityPrice extends EntityPropertyValue {
    readonly priceId: number
    readonly priceList: string
    readonly currency: string
    readonly innerRecordId?: number
    readonly sellable: boolean
    readonly validity?: [BigDecimal | undefined, BigDecimal | undefined]
    readonly priceWithoutTax: BigDecimal
    readonly priceWithTax: BigDecimal
    readonly taxRate: BigDecimal

    constructor(priceId: number,
                priceList: string,
                currency: string,
                innerRecordId: number | undefined,
                sellable: boolean,
                validity: [BigDecimal | undefined, BigDecimal | undefined] | undefined,
                priceWithoutTax: BigDecimal,
                priceWithTax: BigDecimal,
                taxRate: BigDecimal) {
        super()
        this.priceId = priceId
        this.priceList = priceList
        this.currency = currency
        this.innerRecordId = innerRecordId
        this.sellable = sellable
        this.validity = validity
        this.priceWithoutTax = priceWithoutTax
        this.priceWithTax = priceWithTax
        this.taxRate = taxRate
    }

    static fromJson(json: any): EntityPrice {
        return new EntityPrice(json.priceId,
            json.priceList,
            json.currency,
            json.innerRecordId,
            json.sellable,
            json.validity,
            json.priceWithoutTax,
            json.priceWithTax,
            json.taxRate)
    }

    value(): any {
        return this
    }

    isEmpty(): boolean {
        return false
    }

    toPreviewString(context: EntityPropertyValuePreviewStringContext): string {
        const priceFormatter = new Intl.NumberFormat(
            navigator.language,
            { style: 'currency', currency: this.currency, maximumFractionDigits: 2 }
        )
        const actualPriceType: QueryPriceMode = context?.priceType != undefined ? context.priceType : QueryPriceMode.WithTax
        const price: BigDecimal = actualPriceType === QueryPriceMode.WithTax ? this.priceWithTax : this.priceWithoutTax
        const formattedPrice: string = priceFormatter.format(parseFloat(price))

        // return `<i class="mdi mdi-${this.sellable ? 'cash' : 'cash-off'}"></i> ${this.priceId} | ${this.priceList} | ${formattedPrice}`
        return formattedPrice
    }
}

/**
 * Represents a single flattened entity for data table rendering. Where {key} is a serialized {@link EntityPropertyKey}.
 */
export type FlatEntity = {
    readonly [key: string]: EntityPropertyValue | EntityPropertyValue[]
}

/**
 * Represents a single entity property with its key and value. It should be used only for gradual initialization of a new entity.
 */
export type WritableEntityProperty = [EntityPropertyKey, EntityPropertyValue | EntityPropertyValue[]]

/**
 * Holds query result of data grid console query.
 */
export type QueryResult = {
    readonly entities: FlatEntity[],
    readonly totalEntitiesCount: number
}

/**
 * Defines user-desired output format for a single entity property value.
 * The auto output format tries to guess the best renderer based on the property value type with support
 * for all evitaDB data types.
 * Other formats simply take the raw input value and render it in the desired format without any "smart" logic
 * about the actual value.
 */
export enum EntityPropertyValueDesiredOutputFormat {
    /**
     * Renders pretty printed raw input value based on its schema data type.
     */
    AutoPrettyPrint = 'auto-pretty-print',
    /**
     * Renders any rwa input value as a Markdown source.
     */
    Markdown = 'markdown',
    /**
     * Renders any raw input value in code block without any syntax highlighting.
     */
    Raw = 'raw',
    /**
     * Renders any raw input value as a JSON source.
     */
    Json = 'json',
    /**
     * Renders any raw input value as a XML source.
     */
    Xml = 'xml',
    /**
     * Renders HTML in input value.
     */
    Html = 'html',
    /**
     * Special format for rendering entity price object.
     */
    Price = 'price'
}

/**
 * Code languages supported by the data grid console for entity property values in value detail renderer.
 */
export enum EntityPropertyValueSupportedCodeLanguage {
    Raw = 'raw',
    Json = 'json',
    Xml = 'xml'
}
