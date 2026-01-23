import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
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
import type {
    GrpcEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutation_pb.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type { Message } from '@bufbuild/protobuf'

export class DelegatingEngineMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, SchemaMutationConverter<SchemaMutation, Message>>([
        ['createCatalogSchemaMutation', CreateCatalogSchemaMutationConverter.INSTANCE],
        ['modifyCatalogSchemaNameMutation', ModifyCatalogSchemaNameMutationConverter.INSTANCE],
        ['modifyCatalogSchemaMutation', ModifyCatalogSchemaMutationConverter.INSTANCE],
        ['makeCatalogAliveMutation', MakeCatalogAliveMutationConverter.INSTANCE],
        ['removeCatalogSchemaMutation', RemoveCatalogSchemaMutationConverter.INSTANCE],
        ['transactionMutation', TransactionMutationConverter.INSTANCE],
        ['setCatalogMutabilityMutation', SetCatalogMutabilityMutationConverter.INSTANCE],
        ['duplicateCatalogMutation', DuplicateCatalogMutationConverter.INSTANCE],
        ['setCatalogStateMutation', SetCatalogStateMutationConverter.INSTANCE]
    ]);

    static convert(mutation: GrpcEntitySchemaMutation | undefined): SchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingEngineMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}
