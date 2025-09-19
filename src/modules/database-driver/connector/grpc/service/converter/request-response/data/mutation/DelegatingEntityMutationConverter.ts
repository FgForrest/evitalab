import type { GrpcLocalMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcLocalMutation_pb.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    ApplyDeltaAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/ApplyDeltaAttributeMutationConverter.ts'
import {
    UpsertAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/UpsertAttributeMutationConverter.ts'
import {
    RemoveAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/RemoveAttributeMutationConverter.ts'
import {
    UpsertAssociatedDataMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/associated-data/UpsertAssociatedDataMutationConverter.ts'
import {
    RemoveAssociatedDataMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/associated-data/RemoveAssociatedDataMutationConverter.ts'
import {
    UpsertPriceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/price/UpsertPriceMutationConverter.ts'
import {
    RemovePriceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/price/RemovePriceMutationConverter.ts'
import {
    SetPriceInnerRecordHandlingMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/price/SetPriceInnerRecordHandlingMutationConverter.ts'
import {
    SetParentMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/entity/SetParentMutationConverter.ts'
import {
    RemoveParentMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/entity/RemoveParentMutationConverter.ts'
import {
    InsertReferenceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/reference/InsertReferenceMutationConverter.ts'
import {
    RemoveReferenceMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/reference/RemoveReferenceMutationConverter.ts'
import {
    SetReferenceGroupMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/reference/SetReferenceGroupMutationConverter.ts'
import {
    RemoveReferenceGroupMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/reference/RemoveReferenceGroupMutationConverter.ts'
import {
    ReferenceAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/reference/ReferenceAttributeMutationConverter.ts'
import {
    SetEntityScopeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/entity/SetEntityScopeMutationConverter.ts'
import type { GrpcEntityMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutation_pb.ts'
import type { EntityMutation } from '@/modules/database-driver/request-response/data/mutation/EntityMutation.ts'
import type {
    EntityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityMutationConverter.ts'
import {
    EntityUpsertMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityUpsertMutationConverter.ts'
import {
    EntityRemoveMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityRemoveMutationConverter.ts'


function getKeyFromConverterName(converter: any): string { // todo pfi: extract me
    return converter.name
        .replace(/Converter$/, '') // Remove 'Converter' suffix
        .replace(/([A-Z])/g, (match: string, p1: string, offset: number) =>
            offset === 0 ? p1.toLowerCase() : p1
        ); // Convert first letter to lowercase, keep others as-is
}

export class DelegatingEntityMutationConverter implements EntityMutationConverter<EntityMutation, GrpcEntityMutation> {


    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>(
        [
            EntityUpsertMutationConverter,
            EntityRemoveMutationConverter
        ].map(converter => [getKeyFromConverterName(converter), converter])
    );

    static convert(mutation: GrpcEntityMutation | undefined): EntityMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const ConverterClass = DelegatingEntityMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!ConverterClass) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        const converter = new ConverterClass()
        return converter.convert(mutation.mutation.value)
    }
}

