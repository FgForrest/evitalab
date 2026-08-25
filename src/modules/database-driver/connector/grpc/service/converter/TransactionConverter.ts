import type { GrpcTransactionOverview } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaSessionAPI_pb.ts'
import { GrpcChangeCaptureArea } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation.ts'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'

/**
 * Converts gRPC transaction overviews into the internal CDC model, so that committed transactions can be listed in
 * the mutation history alongside the captures they contain.
 */
export class TransactionConverter {

    /**
     * Wraps a single transaction overview into an infrastructure-area capture carrying a {@link TransactionMutation}
     * that aggregates the mutation count and WAL size across all changes of the transaction.
     */
    static convertGrpcTransactionOverview(grpcTransactionOverview: GrpcTransactionOverview): ChangeCatalogCapture {
        const mutation: TransactionMutation = new TransactionMutation(
            EvitaValueConverter.convertGrpcUuid(grpcTransactionOverview.transactionId!).toString(),
            Number(grpcTransactionOverview.catalogVersion),
            grpcTransactionOverview.transactionChanges
                .reduce((total, change) => total + change.mutationCount, 0),
            Number(
                grpcTransactionOverview.transactionChanges
                    .reduce((total, change) => total + Number(change.walSizeInBytes), 0)
            ),
            EvitaValueConverter.convertGrpcOffsetDateTime(grpcTransactionOverview.commitTimestamp!)
        )

        return new ChangeCatalogCapture(
            Number(grpcTransactionOverview.catalogVersion),
            0,
            CatalogSchemaConverter.toCaptureArea(GrpcChangeCaptureArea.INFRASTRUCTURE),
            undefined,
            undefined,
            Operation.Transaction,
            mutation,
            EvitaValueConverter.convertGrpcOffsetDateTime(grpcTransactionOverview.commitTimestamp!)
        )
    }
}
