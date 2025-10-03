import type { GrpcFile } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import type { GrpcFilesToFetchResponse } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { List as ImmutableList } from 'immutable'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'

/**
 * Converts server files between evitaLab's representation and evitaDB's server
 * representation
 */
export class ServerFileConverter {


    convertServerFiles(grpcFiles: GrpcFilesToFetchResponse): PaginatedList<ServerFile> {
        const files: ServerFile[] = []
        for (const grpcFile of grpcFiles.filesToFetch) {
            files.push(this.convert(grpcFile))
        }
        return new PaginatedList(
            ImmutableList(files),
            grpcFiles.pageNumber,
            grpcFiles.pageSize,
            grpcFiles.totalNumberOfRecords
        )
    }

    convert(grpcFile: GrpcFile): ServerFile {
        return new ServerFile(
            EvitaValueConverter.convertGrpcUuid(grpcFile.fileId!),
            grpcFile.name,
            grpcFile.description!,
            grpcFile.contentType,
            BigInt(grpcFile.totalSizeInBytes),
            EvitaValueConverter.convertGrpcOffsetDateTime(grpcFile.created!),
            grpcFile.origin!
        )
    }
}
