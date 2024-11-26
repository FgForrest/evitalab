import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { Connection } from '@/modules/connection/model/Connection'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { i18n } from '@/vue-plugins/i18n'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'

/**
 * Path factory for entity schema
 */
export class EntitySchemaPathFactory extends AbstractSchemaPathFactory<EntitySchemaPointer> {

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof EntitySchemaPointer
    }

    protected resolvePathItems(connection: Connection, schemaPointer: EntitySchemaPointer): SubjectPathItem[] {
        return [
            ...super.resolvePathItems(connection, schemaPointer),
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.entities'))
        ]
    }
}
