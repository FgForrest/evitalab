import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'

/**
 * Fetches camelCase names of representative attributes for an entity type from evitaDB.
 */
export async function resolveRepresentativeAttributes(
    evitaClient: EvitaClient,
    catalogName: string,
    entityType: string
): Promise<string[]> {
    return await evitaClient.queryCatalog(
        catalogName,
        async session => {
            const entitySchema: EntitySchema =
                await session.getEntitySchemaOrThrowException(entityType)
            return Array.from(entitySchema.attributes.values())
                .filter(attr => attr.representative)
                .map(attr => attr.nameVariants.get(NamingConvention.CamelCase)!)
        }
    )
}
