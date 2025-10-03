import { AttributeKey } from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeKey.ts'
import type { GrpcLocale } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb.ts'
import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import type {
    AttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeMutation.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import type { Message } from '@bufbuild/protobuf'

export abstract class AttributeMutationConverter<J extends AttributeMutation, G extends Message> implements LocalMutationConverter<J, G> {

    protected static buildAttributeKey(attributeName: string, attributeLocale: GrpcLocale|undefined): AttributeKey {
        if (attributeLocale && attributeLocale.languageTag !== "") {
            return new AttributeKey(
                attributeName,
                CatalogSchemaConverter.convertLocale(attributeLocale)
            )
        }
        return new AttributeKey(attributeName)
    }

    abstract convert(mutation: G): J
}
