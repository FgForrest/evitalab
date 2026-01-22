import type { GrpcEngineMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'

export interface EngineMutationConverter {
    convertEngineMutation(input: GrpcEngineMutation | undefined): Mutation | undefined
}
