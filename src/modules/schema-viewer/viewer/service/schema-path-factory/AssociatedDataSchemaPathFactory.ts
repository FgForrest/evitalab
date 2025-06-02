import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { i18n } from '@/vue-plugins/i18n'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'

/**
 * Path factory for associated data schema
 */
export class AssociatedDataSchemaPathFactory extends AbstractSchemaPathFactory<AssociatedDataSchemaPointer> {

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof AssociatedDataSchemaPointer
    }

    protected resolvePathItems(schemaPointer: AssociatedDataSchemaPointer): SubjectPathItem[] {
        return [
            ...super.resolvePathItems(schemaPointer),
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.entities')),
            SubjectPathItem.plain(
                schemaPointer.entityType,
                () => {
                    this.createSchemaTab(
                        new EntitySchemaPointer(schemaPointer.catalogName, schemaPointer.entityType)
                    )
                }
            ),
            SubjectPathItem.plain(i18n.global.t('schemaViewer.path.item.associatedData'))
        ]
    }
}
