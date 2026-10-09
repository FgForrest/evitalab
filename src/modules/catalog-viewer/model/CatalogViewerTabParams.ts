import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type { CatalogViewerTabParamsDto } from '@/modules/catalog-viewer/model/CatalogViewerTabParamsDto'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Which catalog the viewer describes.
 */
export class CatalogViewerTabParams implements TabParams<CatalogViewerTabParamsDto> {

    readonly connection: Connection
    readonly catalogName: string

    constructor(connection: Connection, catalogName: string) {
        this.connection = connection
        this.catalogName = catalogName
    }

    toSerializable(): CatalogViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
            connectionName: this.connection.name,
            catalogName: this.catalogName
        }
    }
}
