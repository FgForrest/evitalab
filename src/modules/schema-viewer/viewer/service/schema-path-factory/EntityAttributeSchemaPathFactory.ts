import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { Connection } from '@/modules/connection/model/Connection'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { i18n } from '@/vue-plugins/i18n'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'

/**
 * Path factory for entity attribute schema
 */
export class EntityAttributeSchemaPathFactory extends AbstractSchemaPathFactory<EntityAttributeSchemaPointer> {

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof EntityAttributeSchemaPointer
    }

    protected resolvePathItems(connection: Connection, schemaPointer: EntityAttributeSchemaPointer): SubjectPathItem[] {
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
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.attributes'))
        ]
    }
}
