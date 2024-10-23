import { SchemaPointerDto } from '@/modules/schema-viewer/viewer/model/SchemaPointerDto'

/**
 * Serializable DTO for storing {@link SchemaViewerTabParams} in a storage or link.
 */
export type SchemaViewerTabParamsDto = {
    readonly connectionId: string
    readonly schemaPointer: SchemaPointerDto
}
