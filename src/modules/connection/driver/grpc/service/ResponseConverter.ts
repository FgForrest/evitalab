import { GrpcDataChunk, GrpcPaginatedList, GrpcQueryResponse, GrpcStripList } from "@/modules/connection/driver/grpc/gen/GrpcEvitaSessionAPI_pb";
import { EntityConverter } from "./EntityConverter";
import { Response } from "@/modules/connection/model/data/Response";
import { Value } from "@/modules/connection/model/Value";
import { DataChunk } from "@/modules/connection/model/data/DataChunk";
import { PaginatedList } from "@/modules/connection/model/data/PaginatedList";
import { ExtraResultConverter } from "./ExtraResultConverter";

//TOOD: Implement and add documentation
export class ResponseConverter {
    private readonly entityConverter: EntityConverter;
    private readonly extraResultConverter: ExtraResultConverter;

    constructor(entityConverter: EntityConverter, extraResultConverter: ExtraResultConverter){
        this.entityConverter = entityConverter
        this.extraResultConverter = extraResultConverter
    }

    convert(grpcResponse: GrpcQueryResponse) : Response {
        return new Response(
            Value.of(this.convertDataChunk(grpcResponse.recordPage)),
            Value.of(this.extraResultConverter.convert(grpcResponse.extraResults)),
            grpcResponse.toJsonString()
        )
    }

    private convertDataChunk(driverDataChunk: GrpcDataChunk | undefined): DataChunk {
        if (driverDataChunk == undefined) {
            return PaginatedList.empty()
        }

        const grpcRecordPage = driverDataChunk
        if (grpcRecordPage.chunk.case === 'paginatedList') {
            const page :GrpcPaginatedList = driverDataChunk.chunk.value as GrpcPaginatedList;
            return new PaginatedList(
                Value.of(grpcRecordPage.sealedEntities.map(it => this.entityConverter.convert(it))),
                Value.of(grpcRecordPage.totalRecordCount),
                Value.of(grpcRecordPage.isFirst),
                Value.of(grpcRecordPage.isLast),
                Value.of(grpcRecordPage.hasPrevious),
                Value.of(grpcRecordPage.hasNext),
                Value.of(grpcRecordPage.isSinglePage),
                Value.of(grpcRecordPage.isEmpty),
                Value.of(page.pageSize),
                Value.of(page.pageNumber)
            )
        } else if(grpcRecordPage.chunk.case === 'stripList'){
            return PaginatedList.empty();
        } else {
            return PaginatedList.empty()
        }
    }
}
