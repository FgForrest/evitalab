import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { Connection } from '@/modules/connection/model/Connection'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { SchemaPathFactory } from '@/modules/schema-viewer/viewer/service/schema-path-factory/SchemaPathFactory'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'

/**
 * Base implementation for specific schemas.
 */
export abstract class AbstractSchemaPathFactory<T extends SchemaPointer> implements SchemaPathFactory<T> {

    protected readonly workspaceService: WorkspaceService
    protected readonly schemaViewerTabFactory: SchemaViewerTabFactory

    protected constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        this.workspaceService = workspaceService
        this.schemaViewerTabFactory = schemaViewerTabFactory
    }

    abstract applies(schemaPointer: SchemaPointer): boolean

    resolvePath(connection: Connection, schemaPointer: T): SubjectPath {
        return new ConnectionSubjectPath(
            connection,
            [
                ...this.resolvePathItems(connection, schemaPointer),
                SubjectPathItem.significant(
                    SchemaViewerTabDefinition.icon(),
                    schemaPointer.schemaName
                )
            ]
        )
    }

    protected resolvePathItems(connection: Connection, schemaPointer: T): SubjectPathItem[] {
        return [
            SubjectPathItem.plain(
                schemaPointer.catalogName,
                () => {
                    this.createSchemaTab(
                        connection,
                        new CatalogSchemaPointer(schemaPointer.catalogName)
                    )
                }
            )
        ]
    }

    protected createSchemaTab(connection: Connection, schemaPointer: SchemaPointer): void {
        this.workspaceService.createTab(this.schemaViewerTabFactory.createNew(
            connection,
            schemaPointer
        ))
    }
}
