import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'

/**
 * Path factory for catalog schema
 */
export class CatalogSchemaPathFactory extends AbstractSchemaPathFactory<CatalogSchemaPointer> {

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof CatalogSchemaPointer
    }

    protected resolvePathItems(schemaPointer: CatalogSchemaPointer): SubjectPathItem[] {
        return []
    }
}
