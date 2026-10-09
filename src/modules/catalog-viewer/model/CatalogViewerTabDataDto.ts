import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { CatalogViewerPage } from '@/modules/catalog-viewer/model/CatalogViewerPage'

/**
 * Serializable form of {@link CatalogViewerTabData}; the page is optional so older persisted tabs still restore.
 */
export interface CatalogViewerTabDataDto extends TabDataDto {
    readonly page?: CatalogViewerPage
}
