import { ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'
import { GrpcReferenceIndexType } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'

export class ReferenceIndexTypeConverter {
    static convertReferenceIndexType(indexType: GrpcReferenceIndexType): ReferenceIndexType {
        switch (indexType) {
            case GrpcReferenceIndexType.REFERENCE_INDEX_TYPE_NONE:
                return ReferenceIndexType.None
            case GrpcReferenceIndexType.REFERENCE_INDEX_TYPE_FOR_FILTERING:
                return ReferenceIndexType.ForFiltering
            case GrpcReferenceIndexType.REFERENCE_INDEX_TYPE_FOR_FILTERING_AND_PARTITIONING:
                return ReferenceIndexType.ForFilteringAndPartitioning
        }
    }
}
