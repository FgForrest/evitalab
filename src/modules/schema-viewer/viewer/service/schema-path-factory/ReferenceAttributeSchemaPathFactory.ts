import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory'
import { ReferenceAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { Connection } from '@/modules/connection/model/Connection'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { i18n } from '@/vue-plugins/i18n'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'

/**
 * Path factory for reference attribute schema
 */
export class ReferenceAttributeSchemaPathFactory extends AbstractSchemaPathFactory<ReferenceAttributeSchemaPointer> {

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof ReferenceAttributeSchemaPointer
    }

    protected resolvePathItems(connection: Connection, schemaPointer: ReferenceAttributeSchemaPointer): SubjectPathItem[] {
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
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.references')),
            SubjectPathItem.plain(
                schemaPointer.referenceName,
                () => {
                    this.createSchemaTab(
                        connection,
                        new ReferenceSchemaPointer(schemaPointer.catalogName, schemaPointer.entityType, schemaPointer.referenceName)
                    )
                }
            )
        ]
    }
}
