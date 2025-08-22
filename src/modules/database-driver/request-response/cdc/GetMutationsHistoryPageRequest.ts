/**
 * Request to get a specific page of mutations history.
 * String model equivalent of GrpcGetMutationsHistoryPageRequest
 */
import type { ChangeCaptureCriteria } from '@/modules/database-driver/request-response/cdc/ChangeCaptureCriteria.ts'
import type { ChangeCaptureContent } from '@/modules/database-driver/request-response/cdc/ChangeCaptureContent.ts'

export class GetMutationsHistoryPageRequest {
    /** The page number starting with 1 */
    readonly page: number
    /** The size of the page to return */
    readonly pageSize: number
    /** Starting point for the search (catalog version as string in gRPC; bigint in internal) */
    readonly sinceVersion: string
    /** Starting point for the search (index of the mutation within catalog version) */
    readonly sinceIndex: number
    /** The criteria of the capture, allows to define constraints on the returned mutations */
    readonly criteria: ChangeCaptureCriteria[]
    /** The scope of the returned data - either header of the mutation, or the whole mutation */
    readonly content: ChangeCaptureContent

    constructor(
        page: number,
        pageSize: number,
        sinceVersion: string,
        sinceIndex: number,
        content: ChangeCaptureContent,
        criteria: ChangeCaptureCriteria[] = [],
    ) {
        this.page = page
        this.pageSize = pageSize
        this.sinceVersion = sinceVersion
        this.sinceIndex = sinceIndex
        this.criteria = criteria
        this.content = content
    }
}
