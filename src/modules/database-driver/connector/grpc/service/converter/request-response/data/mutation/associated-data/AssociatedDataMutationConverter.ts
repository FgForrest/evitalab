import type {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import type { GrpcLocale } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb.ts'
import {
    AssociatedDataKey
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataKey.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import type { Message } from '@bufbuild/protobuf'

export abstract class AssociatedDataMutationConverter<J extends AssociatedDataMutation, G extends Message> implements LocalMutationConverter<J, G> {

    protected static buildAssociatedDataKey(associatedDataName: string, associatedDataLocale: GrpcLocale|undefined): AssociatedDataKey {
        if (associatedDataLocale && associatedDataLocale.languageTag !== "") {
            return new AssociatedDataKey(
                associatedDataName,
                CatalogSchemaConverter.convertLocale(associatedDataLocale)
            )
        } else {
            return new AssociatedDataKey(associatedDataName)
        }
    }

    abstract convert(mutation: G): J
}
