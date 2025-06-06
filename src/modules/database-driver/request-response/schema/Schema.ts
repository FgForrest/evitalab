import { List as ImmutableList } from 'immutable'

/**
 * Base database schema descriptor
 */
export interface Schema {

    /**
     * Returns representative flags for this schema. Should return flags that helps end user to visualise how the schema
     * is configured.
     */
    get representativeFlags(): ImmutableList<string>
}
