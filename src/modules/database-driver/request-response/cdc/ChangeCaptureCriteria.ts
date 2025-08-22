/**
 * Record for the criteria of the capture request allowing to limit mutations to specific area of interest and its
 * properties.
 * String model equivalent of GrpcChangeCaptureCriteria
 */
import type { ChangeCaptureArea } from '@/modules/database-driver/request-response/cdc/ChangeCaptureArea.ts'
import type { ChangeCaptureSchemaSite } from '@/modules/database-driver/request-response/cdc/ChangeCaptureSchemaSite.ts'
import type { ChangeCaptureDataSite } from '@/modules/database-driver/request-response/cdc/ChangeCaptureDataSite.ts'

export class ChangeCaptureCriteria {
    /** The area of capture - either schema or data (correlates with the site). */
    readonly area: ChangeCaptureArea
    /** Criteria for schema capture (mutually exclusive with dataSite). */
    readonly schemaSite?: ChangeCaptureSchemaSite
    /** Criteria for data capture (mutually exclusive with schemaSite). */
    readonly dataSite?: ChangeCaptureDataSite

    constructor(area: ChangeCaptureArea, site: { schemaSite: ChangeCaptureSchemaSite } | { dataSite: ChangeCaptureDataSite }) {
        this.area = area
        if ('schemaSite' in site) {
            this.schemaSite = site.schemaSite
        } else {
            this.dataSite = site.dataSite
        }
    }
}
