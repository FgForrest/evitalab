import type { SchemaPointerDto } from '@/modules/schema-viewer/viewer/model/SchemaPointerDto'
import type { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

/**
 * Serializable DTO for storing {@link SchemaViewerTabParams} in a storage or link.
 */
export interface SchemaViewerTabParamsDto extends TabParamsDtoWithConnection {
    readonly schemaPointer: SchemaPointerDto
}
