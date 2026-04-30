import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Finds a schema element by matching a camelCase key against nameVariants. Throws if not found.
 */
export function findSchemaByName<T extends { nameVariants: Map<string, string>; name: string }>(
    key: string,
    schemas: Iterable<T>,
    ownerName: string,
    schemaType: string
): T {
    for (const schema of schemas) {
        if (schema.nameVariants.get(NamingConvention.CamelCase) === key) {
            return schema
        }
    }
    throw new UnexpectedError(
        `${schemaType} '${key}' not found in '${ownerName}'.`
    )
}
