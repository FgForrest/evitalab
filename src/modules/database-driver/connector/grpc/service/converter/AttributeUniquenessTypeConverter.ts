//todo: lho
import { GrpcAttributeUniquenessType } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { AttributeUniquenessType } from '@/modules/database-driver/request-response/schema/AttributeUniquenessType.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

export class AttributeUniquenessTypeConverter {
    static convertAttributeUniquenessType(
        attributeUniquenessType: GrpcAttributeUniquenessType
    ): AttributeUniquenessType {
        switch (attributeUniquenessType) {
            case GrpcAttributeUniquenessType.NOT_UNIQUE:
                return AttributeUniquenessType.NotUnique
            case GrpcAttributeUniquenessType.UNIQUE_WITHIN_COLLECTION:
                return AttributeUniquenessType.UniqueWithinCollection
            case GrpcAttributeUniquenessType.UNIQUE_WITHIN_COLLECTION_LOCALE:
                return AttributeUniquenessType.UniqueWithinCollectionLocale
            default:
                throw new UnexpectedError(
                    `Unsupported attribute uniqueness type '${attributeUniquenessType}'.`
                )
        }
    }
}
