import { SchemaPointerType } from '@/model/editor/tab/schemaViewer/SchemaPointerType'

/**
 * Serializable DTO for storing {@link SchemaPointer} in a storage or link.
 */
export type SchemaPointerDto = {
    readonly type: SchemaPointerType
    readonly params: any
}
