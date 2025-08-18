import {
    LocalCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/LocalCatalogSchemaMutation.ts'
import { List as ImmutableList } from 'immutable'
import type { GrpcEntityScope } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetAttributeSchemaFilterableMutation extends LocalCatalogSchemaMutation {
    readonly kind = 'setAttributeSchemaFilterableMutation'
    readonly name: string
    readonly filterableInScopes: ImmutableList<GrpcEntityScope>

    constructor(name: string, filterableInScopes: Immutable.List<EntityScope>) {
        super()
        this.name = name
        this.filterableInScopes = filterableInScopes
    }
}
