//todo: lho
import type {
    GrpcSetAttributeSchemaFilterableMutation,
    GrpcSetAttributeSchemaGloballyUniqueMutation, GrpcSetAttributeSchemaLocalizedMutation,
    GrpcSetAttributeSchemaNullableMutation, GrpcSetAttributeSchemaRepresentativeMutation,
    GrpcSetAttributeSchemaSortableMutation, GrpcSetAttributeSchemaUniqueMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    SetAttributeSchemaFilterableMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaFilterableMutation.ts'
import type { ScopesConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScopesConverter.ts'
import {
    SetAttributeSchemaLocalizedMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaLocalizedMutation.ts'
import {
    SetAttributeSchemaNullableMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaNullableMutation.ts'
import {
    SetAttributeSchemaRepresentativeMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaRepresentativeMutation.ts'
import {
    SetAttributeSchemaSortableMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaSortableMutation.ts'
import {
    SetAttributeSchemaUniqueMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaUniqueMutation.ts'
import {
    SetAttributeSchemaGloballyUniqueMutation
} from '@/modules/database-driver/request-response/cdc/SetAttributeSchemaGloballyUniqueMutation.ts'

export class SetAttributeSchemaConverter {
    private readonly scopesConverter: ScopesConverter
    constructor(scopesConverter: ScopesConverter) {
        this.scopesConverter = scopesConverter
    }
    public convertSetAttributeSchemaFilterableMutation(setAttributeSchemaFilterableMutation: GrpcSetAttributeSchemaFilterableMutation): SetAttributeSchemaFilterableMutation {
        return new SetAttributeSchemaFilterableMutation(
            setAttributeSchemaFilterableMutation.name,
            this.scopesConverter.convertEntityScopes(setAttributeSchemaFilterableMutation.filterableInScopes)
        )
    }

    public convertSetAttributeSchemaLocalizedMutation(setAttributeSchemaLocalizedMutation: GrpcSetAttributeSchemaLocalizedMutation): SetAttributeSchemaLocalizedMutation {
        return new SetAttributeSchemaLocalizedMutation(
            setAttributeSchemaLocalizedMutation.name,
            setAttributeSchemaLocalizedMutation.localized
        )
    }

    public convertSetAttributeSchemaNullableMutation(setAttributeSchemaNullableMutation: GrpcSetAttributeSchemaNullableMutation): SetAttributeSchemaNullableMutation {
        return new SetAttributeSchemaNullableMutation(
            setAttributeSchemaNullableMutation.name,
            setAttributeSchemaNullableMutation.nullable
        )
    }

    public convertSetAttributeSchemaRepresentativeMutation(setAttributeSchemaRepresentativeMutation: GrpcSetAttributeSchemaRepresentativeMutation): SetAttributeSchemaRepresentativeMutation {
        return new SetAttributeSchemaRepresentativeMutation(
            setAttributeSchemaRepresentativeMutation.name,
            setAttributeSchemaRepresentativeMutation.representative
        )
    }

    public convertSetAttributeSchemaSortableMutation(setAttributeSchemaSortableMutation: GrpcSetAttributeSchemaSortableMutation): SetAttributeSchemaSortableMutation {
        return new SetAttributeSchemaSortableMutation(
            setAttributeSchemaSortableMutation.name,
            this.scopesConverter.convertEntityScopes(setAttributeSchemaSortableMutation.sortableInScopes)
        )
    }

    public convertSetAttributeSchemaUniqueMutation(setAttributeSchemaUniqueMutation: GrpcSetAttributeSchemaUniqueMutation): SetAttributeSchemaUniqueMutation {
        return new SetAttributeSchemaUniqueMutation(
            setAttributeSchemaUniqueMutation.name,
            this.scopesConverter.convertUniqueInScopes(setAttributeSchemaUniqueMutation.uniqueInScopes)
        )
    }

    public convertSetAttributeSchemaGloballyUniqueMutation(setAttributeSchemaGloballyUniqueMutation: GrpcSetAttributeSchemaGloballyUniqueMutation): SetAttributeSchemaGloballyUniqueMutation {
        return new SetAttributeSchemaGloballyUniqueMutation(
            setAttributeSchemaGloballyUniqueMutation.name,
            this.scopesConverter.convertScopedGlobalAttributeUniquenessTypes(setAttributeSchemaGloballyUniqueMutation.uniqueGloballyInScopes)
        )
    }
}
