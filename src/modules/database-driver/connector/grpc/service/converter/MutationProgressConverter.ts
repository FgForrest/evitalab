import type {
    GrpcApplyMutationWithProgressResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaAPI_pb.ts'
import {
    ApplyMutationWithProgressResponse
} from '@/modules/database-driver/request-response/schema/ApplyMutationWithProgressResponse.ts'

/**
 * Converts gRPC progress reports of long-running schema mutations into the internal model.
 */
export class MutationProgressConverter {
    convertMutationWithProgress(mutationProgress: GrpcApplyMutationWithProgressResponse):ApplyMutationWithProgressResponse {
        return new ApplyMutationWithProgressResponse(
            mutationProgress.progressInPercent,
            mutationProgress.catalogVersion,
            mutationProgress.catalogSchemaVersion
        )
    }
}
