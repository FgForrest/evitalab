import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type {
    GrpcEngineMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import {
    RestoreCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/RestoreCatalogSchemaMutationConverter.ts'
import {
    DuplicateCatalogMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/DuplicateCatalogMutationConverter.ts'
import {
    SetCatalogMutabilityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/SetCatalogMutabilityMutationConverter.ts'
import {
    SetCatalogStateMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/SetCatalogStateMutationConverter.ts'
import {
    TransactionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/TransactionMutationConverter.ts'
import {
    RemoveCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/RemoveCatalogSchemaMutationConverter.ts'
import {
    MakeCatalogAliveMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/MakeCatalogAliveMutationConverter.ts'
import {
    ModifyCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/ModifyCatalogSchemaMutationConverter.ts'
import {
    CreateCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/CreateCatalogSchemaMutationConverter.ts'
import {
    ModifyCatalogSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/ModifyCatalogSchemaNameMutationConverter.ts'
import {
    MarkCatalogMissingMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/MarkCatalogMissingMutationConverter.ts'
import {
    UpgradeCatalogFormatMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/UpgradeCatalogFormatMutationConverter.ts'

export class DelegatingEngineMutationConverter {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous mutation-converter registry keyed by grpc oneof case
    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>([
        ['createCatalogSchemaMutation', CreateCatalogSchemaMutationConverter.INSTANCE],
        ['modifyCatalogSchemaNameMutation', ModifyCatalogSchemaNameMutationConverter.INSTANCE],
        ['modifyCatalogSchemaMutation', ModifyCatalogSchemaMutationConverter.INSTANCE],
        ['makeCatalogAliveMutation', MakeCatalogAliveMutationConverter.INSTANCE],
        ['removeCatalogSchemaMutation', RemoveCatalogSchemaMutationConverter.INSTANCE],
        ['transactionMutation', TransactionMutationConverter.INSTANCE],
        ['setCatalogMutabilityMutation', SetCatalogMutabilityMutationConverter.INSTANCE],
        ['duplicateCatalogMutation', DuplicateCatalogMutationConverter.INSTANCE],
        ['setCatalogStateMutation', SetCatalogStateMutationConverter.INSTANCE],
        ['restoreCatalogSchemaMutation', RestoreCatalogSchemaMutationConverter.INSTANCE],
        ['markCatalogMissingMutation', MarkCatalogMissingMutationConverter.INSTANCE],
        ['upgradeCatalogFormatMutation', UpgradeCatalogFormatMutationConverter.INSTANCE]
    ]);

    /**
     * Converts a gRPC engine mutation to its internal counterpart.
     *
     * Returns `undefined` when the oneof case is unset — a newer server sent a mutation this client
     * does not know, so proto3 dropped the unknown field. This is the expected version-skew path at
     * the CDC boundary and must degrade to a header-only capture rather than fail the stream.
     *
     * Still throws {@link UnexpectedError} when the oneof case is known but has no registered
     * converter: regenerated types imply a regenerated registry, so this can only be a forgotten
     * registry entry, which must fail loudly in tests/dev.
     */
    static convert(mutation: GrpcEngineMutation | undefined): SchemaMutation | undefined {
        if (!mutation?.mutation?.case) {
            console.warn('Unknown engine mutation dropped (unset oneof case); degrading to header-only capture.')
            return undefined
        }

        const converter = DelegatingEngineMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}
