import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Resolves path for schema
 */
export interface SchemaPathFactory<T extends SchemaPointer> {

    applies(schemaPointer: SchemaPointer): boolean
    resolvePath(connection: Connection, schemaPointer: T): SubjectPath
}
