import { EvitaDBConnection } from '@/model/lab'
import { TabRequestComponentParams } from '@/model/editor/editor'
import LabEditorSchemaViewerCatalog from '@/components/lab/editor/schema/LabEditorSchemaViewerCatalog.vue'
import LabEditorSchemaViewerEntity from '@/components/lab/editor/schema/LabEditorSchemaViewerEntity.vue'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerAttribute from '@/components/lab/editor/schema/LabEditorSchemaViewerAttribute.vue'
import LabEditorSchemaViewerAssociatedDatum
    from '@/components/lab/editor/schema/LabEditorSchemaViewerAssociatedDatum.vue'
import LabEditorSchemaViewerReference from '@/components/lab/editor/schema/LabEditorSchemaViewerReference.vue'

/**
 * Points to concrete evitaDB schema (catalog, entity, attributes, ...)
 */
export class SchemaViewerDataPointer {
    readonly connection: EvitaDBConnection
    readonly schemaPointer: SchemaPointer

    constructor(connection: EvitaDBConnection, schemaPointer: SchemaPointer) {
        this.connection = connection
        this.schemaPointer = schemaPointer
    }
}

/**
 * Represents props of the LabEditorSchemaViewer component.
 */
export interface SchemaViewerProps extends TabRequestComponentParams {
    readonly dataPointer: SchemaViewerDataPointer
}

/**
 * Defines which concrete schema to show.
 */
export interface SchemaPointer {
    readonly catalogName: string

    /**
     * Returns component that will be used to render this schema.
     */
    component(): Raw<DefineComponent<any, any, any>>

    /**
     * Returns path to this schema.
     */
    path(): string[]
}

/**
 * Points to concrete evitaDB catalog schema
 */
export class CatalogSchemaPointer implements SchemaPointer {
    readonly catalogName: string

    constructor(catalogName: string) {
        this.catalogName = catalogName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerCatalog as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName]
    }
}

/**
 * Points to concrete evitaDB entity schema nested inside a catalog schema.
 */
export class EntitySchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string

    constructor(catalogName: string, entityName: string) {
        this.catalogName = catalogName
        this.entityType = entityName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerEntity as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType]
    }
}

/**
 * Points to evitaDB attribute schema nested inside a catalog schema.
 */
export class CatalogAttributeSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly attributeName: string

    constructor(catalogName: string, attributeName: string) {
        this.catalogName = catalogName
        this.attributeName = attributeName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerAttribute as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'attributes', this.attributeName]
    }
}

/**
 * Points to evitaDB attribute schema nested inside an entity schema.
 */
export class EntityAttributeSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly attributeName: string


    constructor(catalogName: string, entityType: string, attributeName: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.attributeName = attributeName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerAttribute as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType, 'attributes', this.attributeName]
    }
}

/**
 * Points to evitaDB attribute schema nested inside a reference schema.
 */
export class ReferenceAttributeSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly referenceName: string
    readonly attributeName: string

    constructor(catalogName: string, entityType: string, referenceName: string, attributeName: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.referenceName = referenceName
        this.attributeName = attributeName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerAttribute as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType, 'references', this.referenceName, 'attributes', this.attributeName]
    }
}

/**
 * Points to evitaDB associated data schema nested inside an entity schema.
 */
export class AssociatedDataSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly associatedDataName: string

    constructor(catalogName: string, entityType: string, associatedDataName: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.associatedDataName = associatedDataName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerAssociatedDatum as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType, 'associated data', this.associatedDataName]
    }
}

/**
 * Points to evitaDB reference schema nested inside an entity schema.
 */
export class ReferenceSchemaPointer implements SchemaPointer {
    readonly catalogName: string
    readonly entityType: string
    readonly referenceName: string

    constructor(catalogName: string, entityType: string, referenceName: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.referenceName = referenceName
    }

    component(): Raw<DefineComponent<any, any, any>> {
        return markRaw(LabEditorSchemaViewerReference as DefineComponent<any, any, any>)
    }

    path(): string[] {
        return [this.catalogName, 'entities', this.entityType, 'references', this.referenceName]
    }
}
