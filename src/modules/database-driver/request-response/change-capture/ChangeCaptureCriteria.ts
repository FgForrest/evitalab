import { ChangeCaptureArea } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureArea'
import { ChangeCaptureSchemaSite } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureSchemaSite'
import { ChangeCaptureDataSite } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureDataSite'

/**
 * Record for the criteria of the capture request allowing to limit mutations to specific area of interest and its
 * properties.
 */
export class ChangeCaptureCriteria {
    /**
     * The area of capture - either schema or data (correlates with the site)
     */
    readonly area: ChangeCaptureArea
    /**
     * The specific requirements for the designated area
     */
    readonly site?: ChangeCaptureSchemaSite | ChangeCaptureDataSite

    constructor(area: ChangeCaptureArea,
                site: ChangeCaptureSchemaSite | ChangeCaptureDataSite | undefined) {
        this.area = area
        this.site = site
    }
}