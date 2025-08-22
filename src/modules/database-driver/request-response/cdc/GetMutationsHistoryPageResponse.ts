/**
 * Response to GetMutationsHistoryPage request.
 * String model equivalent of GrpcGetMutationsHistoryPageResponse
 */
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'

export class GetMutationsHistoryPageResponse {
    /**
     * The list of mutations that match the criteria
     */
    readonly changeCapture: ChangeCatalogCapture[]

    constructor(changeCapture: ChangeCatalogCapture[]) {
        this.changeCapture = changeCapture
    }
}
