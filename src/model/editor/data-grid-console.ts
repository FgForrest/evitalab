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
    readonly dataLanguage?: string
    readonly displayedData?: string[]
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
    Parent = 'parent',
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
 * Represents a single entity property with its key and value.
 */
export type EntityProperty = [EntityPropertyKey, string]

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
