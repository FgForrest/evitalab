import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { Connection } from '@/modules/connection/model/Connection'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { i18n } from '@/vue-plugins/i18n'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'

/**
 * Path factory for reference schema
 */
export class ReferenceSchemaPathFactory extends AbstractSchemaPathFactory<ReferenceSchemaPointer> {

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof ReferenceSchemaPointer
    }

    protected resolvePathItems(connection: Connection, schemaPointer: ReferenceSchemaPointer): SubjectPathItem[] {
        return [
            ...super.resolvePathItems(connection, schemaPointer),
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.entities')),
            SubjectPathItem.plain(
                schemaPointer.entityType,
                () => {
                    this.createSchemaTab(
                        connection,
                        new EntitySchemaPointer(schemaPointer.catalogName, schemaPointer.entityType)
                    )
                }
            ),
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.references'))
        ]
    }
}
