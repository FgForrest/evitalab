import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/LocalCatalogSchemaMutation.ts'
import type {
    AttributeSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/AttributeSchemaMutation.ts'

/**
 * Placeholder standing in for a nested schema mutation the client could not convert - either a mutation
 * a newer server sent and this client's protos do not know (proto3 drops the unknown oneof branch), or a
 * known branch with no registered converter.
 *
 * It exists so that a single unconvertible nested mutation cannot discard the mutation that contains it.
 * That containing mutation carries the catalog name the CDC cache eviction depends on, so dropping it
 * would silently leave evitaLab showing stale schemas until the tab is reopened.
 */
export class UnknownSchemaMutation implements SchemaMutation, LocalCatalogSchemaMutation, AttributeSchemaMutation {
    static readonly TYPE = 'unknownSchemaMutation' as const

    /**
     * The gRPC oneof case that could not be converted, or undefined when the server sent a branch this
     * client's protos do not contain at all.
     */
    readonly mutationCase: string | undefined

    constructor(mutationCase: string | undefined) {
        this.mutationCase = mutationCase
    }

    getName(): string {
        return this.mutationCase ?? UnknownSchemaMutation.TYPE
    }
}
