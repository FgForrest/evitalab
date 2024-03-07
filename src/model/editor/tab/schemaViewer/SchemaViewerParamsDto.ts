import { SchemaPointerDto } from '@/model/editor/tab/schemaViewer/SchemaPointerDto'

/**
 * Serializable DTO for storing {@link SchemaViewerParams} in a storage or link.
 */
export type SchemaViewerParamsDto = {
    readonly connectionId: string
    readonly schemaPointer: SchemaPointerDto
}
