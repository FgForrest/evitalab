import type {
    GrpcSetReferenceSchemaIndexedMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    SetReferenceSchemaIndexedMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/SetReferenceSchemaIndexedMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType.ts'
import {
    ReferenceIndexTypeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ReferenceIndexTypeConverter.ts'
import { ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'
import { List as ImmutableList } from 'immutable'

export class SetReferenceSchemaIndexedMutationConverter implements SchemaMutationConverter<SetReferenceSchemaIndexedMutation, GrpcSetReferenceSchemaIndexedMutation> {
    public static readonly INSTANCE = new SetReferenceSchemaIndexedMutationConverter()

    convert(mutation: GrpcSetReferenceSchemaIndexedMutation): SetReferenceSchemaIndexedMutation {
        if (mutation.inherited) {
            return new SetReferenceSchemaIndexedMutation(mutation.name, undefined)
        }

        let indexedInScopes: ScopedReferenceIndexType[]
        if (mutation.scopedIndexTypes.length > 0) {
            indexedInScopes = mutation.scopedIndexTypes.map(scopedType =>
                new ScopedReferenceIndexType(
                    EntityConverter.convertEntityScope(scopedType.scope),
                    ReferenceIndexTypeConverter.convertReferenceIndexType(scopedType.indexType)
                )
            )
        } else if (mutation.indexedInScopes.length > 0) {
            indexedInScopes = mutation.indexedInScopes.map(scope =>
                new ScopedReferenceIndexType(EntityConverter.convertEntityScope(scope), ReferenceIndexType.ForFiltering)
            )
        } else {
            indexedInScopes = ScopedReferenceIndexType.Empty
        }

        return new SetReferenceSchemaIndexedMutation(mutation.name, ImmutableList(indexedInScopes))
    }
}
