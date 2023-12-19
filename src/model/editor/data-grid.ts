import { EvitaDBConnection, QueryLanguage, UnexpectedError } from '@/model/lab'
import {
    CatalogPointer,
    ExecutableTabRequest,
    TabRequestComponentData,
    TabRequestComponentParams
} from '@/model/editor/editor'

/**
 * Points to concrete evitaDB collection to fetch data from.
 */
export class DataGridDataPointer extends CatalogPointer implements TabRequestComponentParams {
    readonly entityType: string

    constructor(connection: EvitaDBConnection, catalogName: string, entityType: string) {
        super(connection, catalogName)
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
    References = 'references',
    ReferenceAttributes = 'referenceAttributes'
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
 * Represents key of a single typed entity property.
 */
export class EntityPropertyKey {
    static readonly entityPropertyPartSeparator: string = ':'

    readonly type: EntityPropertyType
    readonly names: string[]
    get name(): string {
        if (this.names.length != 1) {
            throw new UnexpectedError(undefined, `Cannot get name of a property key with multiple names: ${this.names}`)
        }
        return this.names[0]
    }

    constructor(type: EntityPropertyType, names: string[]) {
        this.type = type
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

    toString(): string {
        if (this.type === EntityPropertyType.Entity) {
            return this.names.join(EntityPropertyKey.entityPropertyPartSeparator)
        }
        return `${this.type}${EntityPropertyKey.entityPropertyPartSeparator}${this.names.join(EntityPropertyKey.entityPropertyPartSeparator)}`
    }
}

/**
 * Full description of a single entity property
 */
export class EntityPropertyDescriptor {
    readonly type: EntityPropertyType
    readonly key: EntityPropertyKey
    readonly title: string
    readonly flattenedTitle: string
    readonly schema: any | undefined
    readonly children: EntityPropertyDescriptor[]

    constructor(type: EntityPropertyType,
                key: EntityPropertyKey,
                title: string,
                flattenedTitle: string,
                schema: any | undefined,
                children: EntityPropertyDescriptor[]) {
        this.type = type
        this.key = key
        this.title = title
        this.flattenedTitle = flattenedTitle
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
