import type { Component } from 'vue'
import { markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { CatalogViewerTabParams } from '@/modules/catalog-viewer/model/CatalogViewerTabParams'
import { CatalogViewerTabData } from '@/modules/catalog-viewer/model/CatalogViewerTabData'
import CatalogViewer from '@/modules/catalog-viewer/component/CatalogViewer.vue'

/**
 * Tab of the catalog preview — one catalog, described by the pages of `CatalogViewer`.
 */
export class CatalogViewerTabDefinition extends TabDefinition<CatalogViewerTabParams, CatalogViewerTabData> {

    constructor(title: string, params: CatalogViewerTabParams, initialData: CatalogViewerTabData) {
        super(
            undefined,
            title,
            CatalogViewerTabDefinition.icon(),
            markRaw(CatalogViewer as Component),
            params,
            initialData
        )
    }

    get tabType(): TabType {
        return TabType.CatalogViewer
    }

    static icon(): string {
        return 'mdi-database-search-outline'
    }
}
