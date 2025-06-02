import { ExtraResults } from './ExtraResults'
import { DataChunk } from '@/modules/database-driver/request-response/data/DataChunk'

/**
 * evitaLab's representation of a full response independent of specific evitaDB version
 */
export class EvitaResponse {

    readonly recordPage: DataChunk
    readonly extraResults: ExtraResults | undefined

    readonly rawResponse: string

    constructor(recordPage: DataChunk,
                extraResults: ExtraResults | undefined,
                rawResponse: string) {
        this.recordPage = recordPage
        this.rawResponse = rawResponse
        this.extraResults = extraResults
    }
}
