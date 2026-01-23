import type { GrpcTransactionMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcInfrastrutureMutation_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class TransactionMutationConverter implements SchemaMutationConverter<TransactionMutation, GrpcTransactionMutation> {
    public static readonly INSTANCE = new TransactionMutationConverter()

    convert(mutation: GrpcTransactionMutation): TransactionMutation {
       return new TransactionMutation(
           EvitaValueConverter.convertGrpcUuid(mutation.transactionId!).toString(),
           Number(mutation.version),
           mutation.mutationCount,
           Number(mutation.walSizeInBytes),
           EvitaValueConverter.convertGrpcOffsetDateTime(mutation.commitTimestamp!)
       )
    }
}
