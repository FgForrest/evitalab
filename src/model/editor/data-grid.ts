import { EvitaDBConnection, QueryLanguage } from '@/model/lab'
import { ExecutableTabRequest, TabRequestComponentData, TabRequestComponentParams } from '@/model/editor/editor'

/**
 * Points to concrete evitaDB collection to fetch data from.
 */
export class DataGridDataPointer implements TabRequestComponentParams {
    readonly connection: EvitaDBConnection
    readonly catalogName: string
    readonly entityType: string

    constructor(connection: EvitaDBConnection, catalogName: string, entityType: string) {
        this.connection = connection
        this.catalogName = catalogName
        this.entityType = entityType
    }
}

/**
 * Represents props of the LabEditorConsoleDataGrid component.
 */
export interface DataGridConsoleParams extends TabRequestComponentParams, ExecutableTabRequest {
    readonly dataPointer: DataGridDataPointer
}

/**
 * Represents injectable/storable user data of the LabEditorConsoleDataGrid component.
 */
export interface DataGridConsoleData extends TabRequestComponentData {
    readonly queryLanguage?: QueryLanguage
    readonly filterBy?: string
    readonly orderBy?: string
    readonly dataLocale?: string
    readonly displayedProperties?: EntityPropertyKey[]
    readonly pageSize?: number
    readonly pageNumber?: number
}

/**
 * Types of entity properties with their prefixes
 */
export enum EntityPropertyType {
    Entity = '',
    Attributes = 'attributes',
    AssociatedData = 'associatedData',
    References = 'references'
}

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
 * Represents key of a single typed entity property.
 */
export class EntityPropertyKey {
    readonly type: EntityPropertyType
    readonly name: string

    constructor(type: EntityPropertyType, name: string) {
        this.type = type
        this.name = name
    }

    static entity(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Entity, name)
    }

    static attributes(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Attributes, name)
    }

    static associatedData(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.AssociatedData, name)
    }

    static references(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.References, name)
    }

    static fromString(propertyKey: string): EntityPropertyKey {
        if (propertyKey.startsWith(EntityPropertyType.Attributes)) {
            return new EntityPropertyKey(EntityPropertyType.Attributes, propertyKey.substring(EntityPropertyType.Attributes.length + 1))
        } else if (propertyKey.startsWith(EntityPropertyType.AssociatedData)) {
            return new EntityPropertyKey(EntityPropertyType.AssociatedData, propertyKey.substring(EntityPropertyType.AssociatedData.length + 1))
        } else if (propertyKey.startsWith(EntityPropertyType.References)) {
            return new EntityPropertyKey(EntityPropertyType.References, propertyKey.substring(EntityPropertyType.References.length + 1))
        } else {
            return new EntityPropertyKey(EntityPropertyType.Entity, propertyKey)
        }
    }

    toString(): string {
        if (this.type === EntityPropertyType.Entity) {
            return this.name
        }
        return `${this.type}.${this.name}`
    }
}

/**
 * Full description of a single entity property
 */
export type EntityPropertyDescriptor = {
    type: EntityPropertyType,
    key: EntityPropertyKey,
    title: string,
    schema: any | undefined
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
 * Represents a single entity property with its key and value.
 */
export type EntityProperty = [EntityPropertyKey, any]

/**
 * Represents a pointer to a referenced entity in another grid.
 */
export class EntityReferenceValue {
    readonly primaryKey: number
    readonly representativeAttributes: any[]

    constructor(primaryKey: number, representativeAttributes: any[]) {
        this.primaryKey = primaryKey
        this.representativeAttributes = representativeAttributes
    }
}

/**
 * Represents a single flattened entity for data table rendering.
 */
export type FlatEntity = EntityProperty[]

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
    Html = 'html'
    // we could keep adding more languages here potentially
}

/**
 * Code languages supported by the data grid console for entity property values in value detail renderer.
 */
export enum EntityPropertyValueSupportedCodeLanguage {
    Raw = 'raw',
    Json = 'json',
    Xml = 'xml'
}
