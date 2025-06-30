import {
    AbstractSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AbstractSchemaPathFactory.ts'
import  {
    SortableCompoundSchemaPointer
} from '@/modules/schema-viewer/viewer/model/SortableCompoundSchemaPointer.ts'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer.ts'
import type { WorkspaceService } from '@/modules/workspace/service/WorkspaceService.ts'
import type { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory.ts'

export class SortableCompoundSchemaPathFactory extends AbstractSchemaPathFactory<SortableCompoundSchemaPointer> {
    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        super(workspaceService, schemaViewerTabFactory)
    }
    applies(schemaPointer: SchemaPointer): boolean {
        return schemaPointer instanceof SortableCompoundSchemaPointer
    }

}
