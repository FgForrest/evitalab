import type { TabData } from '@/modules/workspace/tab/model/TabData'
import type { CatalogViewerTabDataDto } from '@/modules/catalog-viewer/model/CatalogViewerTabDataDto'
import { CatalogViewerPage } from '@/modules/catalog-viewer/model/CatalogViewerPage'

/**
 * The page the user last looked at, so a restored or shared tab reopens where it was left.
 */
export class CatalogViewerTabData implements TabData<CatalogViewerTabDataDto> {

    readonly page: CatalogViewerPage

    constructor(page: CatalogViewerPage = CatalogViewerPage.Overview) {
        this.page = page
    }

    toSerializable(): CatalogViewerTabDataDto {
        return { page: this.page }
    }
}
