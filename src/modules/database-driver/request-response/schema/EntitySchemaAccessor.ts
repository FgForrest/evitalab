import { List } from 'immutable'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'

/**
 * An interface for accessing entity schemas.
 */
export interface EntitySchemaAccessor {

    /**
     * Returns a collection of all entity schemas in a catalog.
     */
    getEntitySchemas(): Promise<List<EntitySchema>>

    /**
     * Retrieves the entity schema for the given entity type.
     */
    getEntitySchema(entityType: string): Promise<EntitySchema | undefined>
}
