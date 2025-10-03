//todo: lho
import type {
    GrpcApplyMutationWithProgressResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb.ts'
import {
    ApplyMutationWithProgressResponse
} from '@/modules/database-driver/request-response/schema/ApplyMutationWithProgressResponse.ts'

export class MutationProgressConverter {
    convertMutationWithProgress(mutationProgress: GrpcApplyMutationWithProgressResponse):ApplyMutationWithProgressResponse {
        return new ApplyMutationWithProgressResponse(
            mutationProgress.progressInPercent,
            mutationProgress.catalogVersion,
            mutationProgress.catalogSchemaVersion
        )
    }
}
