import { SchemaPointerType } from '@/modules/schema-viewer/viewer/model/SchemaPointerType'

/**
 * Serializable DTO for storing {@link SchemaPointer} in a storage or link.
 */
export type SchemaPointerDto = {
    readonly type: SchemaPointerType
    readonly params: any
}
