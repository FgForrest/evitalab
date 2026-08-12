import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import { List as ImmutableList } from 'immutable'
import type { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

/**
 * Common ancestor of all schema representations. Provides shared helpers for building the
 * representative flags that summarize a schema in the schema viewer.
 */
export abstract class AbstractSchema implements Schema {

    abstract get representativeFlags(): ImmutableList<Flag>

    /**
     * Converts a raw evitaDB data type name into a shorter form suitable for a flag label.
     */
    protected formatDataTypeForFlag(dataType: string): string {
        return dataType
            .replace('Array', '[]')
    }
}
