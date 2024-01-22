import { EvitaDBConnection, UnexpectedError } from '@/model/lab'
import {
    SerializableTabRequestComponentParams,
    TabRequestComponentParams,
    TabRequestComponentParamsDto
} from '@/model/editor/editor'
import LabEditorSchemaViewerCatalog from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerCatalog.vue'
import LabEditorSchemaViewerEntity from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerEntity.vue'
import { DefineComponent, markRaw, Raw } from 'vue'
import LabEditorSchemaViewerAttribute from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerAttribute.vue'
import LabEditorSchemaViewerAssociatedDatum
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerAssociatedDatum.vue'
import LabEditorSchemaViewerReference from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerReference.vue'
import { LabService } from '@/services/lab.service'

/**
 * Represents props of the LabEditorSchemaViewer component.
 */
export class SchemaViewerParams extends SerializableTabRequestComponentParams<SchemaViewerParamsDto> implements TabRequestComponentParams {
    readonly dataPointer: SchemaViewerDataPointer

    constructor(dataPointer: SchemaViewerDataPointer) {
        super()
        this.dataPointer = dataPointer
    }

    static restoreFromSerializable(labService: LabService, json: TabRequestComponentParamsDto): SchemaViewerParams {
        const dto: SchemaViewerParamsDto = json as SchemaViewerParamsDto

        const schemaPointerType: SchemaPointerType = dto.schemaPointer.type
        const schemaPointerParams: any = dto.schemaPointer.params
        let schemaPointer: SchemaPointer
        switch (schemaPointerType) {
            case SchemaPointerType.CatalogSchema:
                schemaPointer = new CatalogSchemaPointer(schemaPointerParams.catalogName)
                break;
            case SchemaPointerType.EntitySchema:
                schemaPointer = new EntitySchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType)
                break;
            case SchemaPointerType.CatalogAttributeSchema:
                schemaPointer = new CatalogAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.attributeName)
                break;
            case SchemaPointerType.EntityAttributeSchema:
                schemaPointer = new EntityAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.attributeName)
                break;
            case SchemaPointerType.ReferenceAttributeSchema:
                schemaPointer = new ReferenceAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.referenceName, schemaPointerParams.attributeName)
                break;
            case SchemaPointerType.AssociatedDataSchema:
                schemaPointer = new AssociatedDataSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.associatedDataName)
                break;
            case SchemaPointerType.ReferenceSchema:
                schemaPointer = new ReferenceSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.referenceName)
                break;
            default:
                throw new UnexpectedError(undefined, 'Unknown schema pointer type.')
        }

        return new SchemaViewerParams(
            new SchemaViewerDataPointer(
                labService.getConnection(dto.connectionId),
                schemaPointer
            )
        )
    }

    toSerializable(): SchemaViewerParamsDto {
        let schemaPointerType: SchemaPointerType
        let schemaPointerParams: any
        const schemaPointer: SchemaPointer = this.dataPointer.schemaPointer
        if (schemaPointer instanceof CatalogSchemaPointer) {
            schemaPointerType = SchemaPointerType.CatalogSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName
            }
        } else if (schemaPointer instanceof EntitySchemaPointer) {
            schemaPointerType = SchemaPointerType.EntitySchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType
            }
        } else if (schemaPointer instanceof CatalogAttributeSchemaPointer) {
            schemaPointerType = SchemaPointerType.CatalogAttributeSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                attributeName: schemaPointer.attributeName
            }
        } else if (schemaPointer instanceof EntityAttributeSchemaPointer) {
            schemaPointerType = SchemaPointerType.EntityAttributeSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                attributeName: schemaPointer.attributeName
            }
        } else if (schemaPointer instanceof ReferenceAttributeSchemaPointer) {
            schemaPointerType = SchemaPointerType.ReferenceAttributeSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                referenceName: schemaPointer.referenceName,
                attributeName: schemaPointer.attributeName
            }
        } else if (schemaPointer instanceof AssociatedDataSchemaPointer) {
            schemaPointerType = SchemaPointerType.AssociatedDataSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                associatedDataName: schemaPointer.associatedDataName
            }
        } else if (schemaPointer instanceof ReferenceSchemaPointer) {
            schemaPointerType = SchemaPointerType.ReferenceSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                referenceName: schemaPointer.referenceName
            }
        } else {
            throw new UnexpectedError(undefined, 'Unknown schema pointer type.')
        }

        return {
            connectionId: this.dataPointer.connection.id,
            schemaPointer: {
                type: schemaPointerType,
                params: schemaPointerParams
            }
        }
    }
}

/**
 * Serializable DTO for storing {@link SchemaViewerParams} in a storage or link.
 */
type SchemaViewerParamsDto = {
    readonly connectionId: string
    readonly schemaPointer: SchemaPointerDto
}

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
 * Serializable DTO for storing {@link SchemaPointer} in a storage or link.
 */
type SchemaPointerDto = {
    readonly type: SchemaPointerType
    readonly params: any
}

/**
 * Defines supported pointer type for serialization.
 */
enum SchemaPointerType {
    CatalogSchema = 'catalog-schema',
    EntitySchema = 'entity-schema',
    CatalogAttributeSchema = 'catalog-attribute-schema',
    EntityAttributeSchema = 'entity-attribute-schema',
    ReferenceAttributeSchema = 'reference-attribute-schema',
    AssociatedDataSchema = 'associated-data-schema',
    ReferenceSchema = 'reference-schema',
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
