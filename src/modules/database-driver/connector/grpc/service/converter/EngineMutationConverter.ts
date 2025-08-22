//TODO: lho

import type {
    GrpcCreateCatalogSchemaMutation, GrpcDuplicateCatalogMutation,
    GrpcEngineMutation,
    GrpcMakeCatalogAliveMutation, GrpcModifyCatalogSchemaMutation, GrpcModifyCatalogSchemaNameMutation,
    GrpcRemoveCatalogSchemaMutation, GrpcRestoreCatalogSchemaMutation, GrpcSetCatalogMutabilityMutation,
    GrpcSetCatalogStateMutation, GrpcTransactionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'
import {
    CreateCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/CreateCatalogSchemaMutation.ts'
import {
    ModifyCatalogSchemaNameMutation
} from '@/modules/database-driver/request-response/cdc/ModifyCatalogSchemaNameMutation.ts'
import {
    ModifyCatalogSchemaMutation
} from '@/modules/database-driver/request-response/cdc/ModifyCatalogSchemaMutation.ts'

export class EngineMutationConverter {
    convertEngineMutation(
    input: GrpcEngineMutation | undefined,
): EngineMutation | undefined {
        if (input) {
            return undefined
        }
        const mutation = input!.mutation;
        if (!mutation || !mutation.case) {
            throw new Error('GrpcEngineMutation.mutation is undefined');
        }
        const { case: caseName, value } = mutation;
        switch (caseName) {
            case 'createCatalogSchemaMutation':
                return this.convertCreateCatalogSchemaMutation(
                    value
                )
            case 'modifyCatalogSchemaNameMutation':
                return this.convertModifyCatalogSchemaNameMutation(value);
            case 'modifyCatalogSchemaMutation':
                return {
                    kind: 'modifyCatalogSchemaMutation',
                    mutation: convertGrpcModifyCatalogSchemaMutationToModifyCatalogSchemaMutation(
                        value as GrpcModifyCatalogSchemaMutation,
                    ),
                };
            case 'makeCatalogAliveMutation':
                return {
                    kind: 'makeCatalogAliveMutation',
                    mutation: convertGrpcMakeCatalogAliveMutationToMakeCatalogAliveMutation(
                        value as GrpcMakeCatalogAliveMutation,
                    ),
                };
            case 'removeCatalogSchemaMutation':
                return {
                    kind: 'removeCatalogSchemaMutation',
                    mutation: convertGrpcRemoveCatalogSchemaMutationToRemoveCatalogSchemaMutation(
                        value as GrpcRemoveCatalogSchemaMutation,
                    ),
                };
            case 'transactionMutation':
                return {
                    kind: 'transactionMutation',
                    mutation: convertGrpcTransactionMutationToTransactionMutation(
                        value as GrpcTransactionMutation,
                    ),
                };
            case 'setCatalogMutabilityMutation':
                return {
                    kind: 'setCatalogMutabilityMutation',
                    mutation: convertGrpcSetCatalogMutabilityMutationToSetCatalogMutabilityMutation(
                        value as GrpcSetCatalogMutabilityMutation,
                    ),
                };
            case 'duplicateCatalogMutation':
                return {
                    kind: 'duplicateCatalogMutation',
                    mutation: convertGrpcDuplicateCatalogMutationToDuplicateCatalogMutation(
                        value as GrpcDuplicateCatalogMutation,
                    ),
                };
            case 'setCatalogStateMutation':
                return {
                    kind: 'setCatalogStateMutation',
                    mutation: convertGrpcSetCatalogStateMutationToSetCatalogStateMutation(
                        value as GrpcSetCatalogStateMutation,
                    ),
                };
            case 'restoreCatalogSchemaMutation':
                return {
                    kind: 'restoreCatalogSchemaMutation',
                    mutation: convertGrpcRestoreCatalogSchemaMutationToRestoreCatalogSchemaMutation(
                        value as GrpcRestoreCatalogSchemaMutation,
                    ),
                };
            default:
                throw new Error()
        }
    }

    convertCreateCatalogSchemaMutation(createCatalogSchemaMutation: GrpcCreateCatalogSchemaMutation): CreateCatalogSchemaMutation {
        return new CreateCatalogSchemaMutation(createCatalogSchemaMutation.catalogName)
    }

    convertModifyCatalogSchemaNameMutation(modifyCatalogSchemaNameMutation: GrpcModifyCatalogSchemaNameMutation): ModifyCatalogSchemaNameMutation {
        return new ModifyCatalogSchemaNameMutation(modifyCatalogSchemaNameMutation.catalogName, modifyCatalogSchemaNameMutation.newCatalogName, modifyCatalogSchemaNameMutation.overwriteTarget)
    }

    convertModifyCatalogSchemaMutation(modifyCatalogSchemaMutation: GrpcModifyCatalogSchemaMutation): ModifyCatalogSchemaMutation {
        return new ModifyCatalogSchemaMutation(
            modifyCatalogSchemaMutation.catalogName,

        )
    }
}
