import { EntityConverter } from "./EntityConverter";
import { ExtraResultConverter } from "./ExtraResultConverter";
import type {
    GrpcDataChunk,
    GrpcPaginatedList,
    GrpcQueryResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaSessionAPI_pb'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { DataChunk } from '@/modules/database-driver/request-response/data/DataChunk'
import { PaginatedList } from '@/modules/database-driver/request-response/data/PaginatedList'
import { serializeJsonWithBigInt } from '@/utils/JsonUtil.ts'

export class EvitaResponseConverter {
    private readonly entityConverter: EntityConverter;
    private readonly extraResultConverter: ExtraResultConverter;

    constructor(entityConverter: EntityConverter, extraResultConverter: ExtraResultConverter){
        this.entityConverter = entityConverter
        this.extraResultConverter = extraResultConverter
    }

    convert(grpcResponse: GrpcQueryResponse) : EvitaResponse {
        return new EvitaResponse(
            this.convertDataChunk(grpcResponse.recordPage),
            this.extraResultConverter.convert(grpcResponse.extraResults),
            // Important FIX: Prevent number overflow when bigint is bigger number (Crashing in price's datetime)
            serializeJsonWithBigInt(grpcResponse)
        )
    }

    private convertDataChunk(driverDataChunk: GrpcDataChunk | undefined): DataChunk {
        if (driverDataChunk == undefined) {
            return PaginatedList.empty()
        }

        const grpcRecordPage = driverDataChunk
        if (grpcRecordPage.chunk.case === 'paginatedList') {
            const page :GrpcPaginatedList = driverDataChunk.chunk.value as GrpcPaginatedList;
            try {
                return new PaginatedList(
                    grpcRecordPage.sealedEntities.map(it => this.entityConverter.convert(it)),
                    grpcRecordPage.totalRecordCount,
                    grpcRecordPage.isFirst,
                    grpcRecordPage.isLast,
                    grpcRecordPage.hasPrevious,
                    grpcRecordPage.hasNext,
                    grpcRecordPage.isSinglePage,
                    grpcRecordPage.isEmpty,
                    page.pageSize,
                    page.pageNumber
                )
            } catch (e) {
                console.log(e)
                return PaginatedList.empty()
            }

        } else if(grpcRecordPage.chunk.case === 'stripList'){
            return PaginatedList.empty();
        } else {
            return PaginatedList.empty()
        }
    }
}
