import { List as ImmutableList } from 'immutable'
import type { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

/**
 * Base database schema descriptor
 */
export interface Schema {

    /**
     * Returns representative flags for this schema. Should return flags that helps end user to visualise how the schema
     * is configured.
     */
    get representativeFlags(): ImmutableList<Flag>
}
