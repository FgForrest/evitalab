import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'

export class CatalogVersionAtResponse {
    readonly version: bigint
    readonly introducedAt: OffsetDateTime

    constructor(version: bigint, introducedAt: OffsetDateTime) {
        this.version = version
        this.introducedAt = introducedAt
    }
}
