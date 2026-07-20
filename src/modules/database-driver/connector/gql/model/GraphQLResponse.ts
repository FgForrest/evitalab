import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'

/**
 * GraphQL API response type definition.
 */
export type GraphQLResponse = {
    data: GraphQLResultNode,
    errors: unknown[]
}
