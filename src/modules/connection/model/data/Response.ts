import { DataChunk } from '@/modules/connection/model/data/DataChunk'
import { Value } from '@/modules/connection/model/Value'
import { ExtraResults } from './ExtraResults'

/**
 * evitaLab's representation of a full response independent of specific evitaDB version
 */
export class Response {

    readonly recordPage: Value<DataChunk>
    readonly extraResults: Value<ExtraResults | undefined>

    readonly rawResponse: string

    constructor(recordPage: Value<DataChunk>, extraResults: Value<ExtraResults | undefined>, rawResponse: string) {
        this.recordPage = recordPage
        this.rawResponse = rawResponse
        this.extraResults = extraResults
    }
}
