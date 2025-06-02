import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

/**
 * Represents server file
 */
export class ServerFile {
    readonly fileId: Uuid
    readonly name: string
    readonly description: string
    readonly contentType: string
    readonly totalSizeInBytes: bigint
    readonly created: OffsetDateTime | undefined
    readonly origin: string

    constructor(
        fileId: Uuid,
        name: string,
        description: string,
        contentType: string,
        totalSizeInBytes: bigint,
        created: OffsetDateTime | undefined,
        origin: string
    ) {
        this.fileId = fileId
        this.name = name
        this.description = description
        this.contentType = contentType
        this.totalSizeInBytes = totalSizeInBytes
        this.created = created
        this.origin = origin
    }
}
