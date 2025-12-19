import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

export class CatalogVersionAtResponse {
    readonly startVersion: bigint
    readonly endVersion: bigint
    readonly introducedAt: OffsetDateTime

    constructor(startVersion: bigint, endVersion: bigint, introducedAt: OffsetDateTime) {
        this.startVersion = startVersion
        this.endVersion = endVersion
        this.introducedAt = introducedAt
    }
}
