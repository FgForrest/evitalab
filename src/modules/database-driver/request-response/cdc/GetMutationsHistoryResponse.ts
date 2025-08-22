/**
* Response to GetMutationsHistory request.
* String model equivalent of GrpcGetMutationsHistoryResponse
*/
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'

export class GetMutationsHistoryResponse {
    /**
     * The list of mutations that match the criteria
     */
    readonly changeCapture: ChangeCatalogCapture[]

    constructor(changeCapture: ChangeCatalogCapture[]) {
        this.changeCapture = changeCapture
    }
}
