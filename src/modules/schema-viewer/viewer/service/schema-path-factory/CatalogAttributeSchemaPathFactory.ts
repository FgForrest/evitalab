import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { Connection } from '@/modules/connection/model/Connection'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { i18n } from '@/vue-plugins/i18n'

/**
 * Path factory for catalog attribute schema
 */
export class CatalogAttributeSchemaPathFactory extends AbstractSchemaPathFactory<CatalogAttributeSchemaPointer> {

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof CatalogAttributeSchemaPointer
    }

    protected resolvePathItems(connection: Connection, schemaPointer: CatalogAttributeSchemaPointer): SubjectPathItem[] {
        return [
            ...super.resolvePathItems(connection, schemaPointer),
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.attributes'))
        ]
    }
}
