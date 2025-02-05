import { GrpcFile } from '@/modules/connection/driver/grpc/gen/GrpcEvitaDataTypes_pb'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { GrpcFilesToFetchResponse } from '@/modules/connection/driver/grpc/gen/GrpcEvitaManagementAPI_pb'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import Immutable from 'immutable'
import { EvitaValueConverter } from '@/modules/connection/driver/grpc/service/EvitaValueConverter'

/**
 * Converts server files between evitaLab's representation and evitaDB's server
 * representation
 */
export class ServerFileConverter {

    private readonly evitaValueConverter: EvitaValueConverter

    constructor(evitaValueConverter: EvitaValueConverter) {
        this.evitaValueConverter = evitaValueConverter
    }

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
            this.evitaValueConverter.convertGrpcUuid(grpcFile.fileId!),
            grpcFile.name,
            grpcFile.description!,
            grpcFile.contentType,
            grpcFile.totalSizeInBytes,
            this.evitaValueConverter.convertGrpcOffsetDateTime(grpcFile.created!),
            grpcFile.origin!
        )
    }
}
