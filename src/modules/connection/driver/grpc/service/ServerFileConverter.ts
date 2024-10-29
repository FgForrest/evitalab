import { GrpcFile } from '@/modules/connection/driver/grpc/gen/GrpcEvitaDataTypes_pb'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { GrpcFilesToFetchResponse } from '@/modules/connection/driver/grpc/gen/GrpcEvitaManagementAPI_pb'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import Immutable from 'immutable'

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
            Immutable.List(files),
            grpcFiles.pageNumber,
            grpcFiles.pageSize,
            grpcFiles.totalNumberOfRecords
        )
    }

    convert(grpcFile: GrpcFile): ServerFile {
        return new ServerFile(
            Uuid.createUUID(
                grpcFile.fileId?.mostSignificantBits!,
                grpcFile.fileId?.leastSignificantBits!
            ),
            grpcFile.name,
            grpcFile.description!,
            grpcFile.contentType,
            grpcFile.totalSizeInBytes,
            new OffsetDateTime(
                grpcFile.created!.timestamp!,
                grpcFile.created!.offset
            ),
            grpcFile.origin!
        )
    }
}
