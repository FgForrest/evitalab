import type { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

/**
 * Serializable form of {@link CatalogViewerTabParams}.
 */
export interface CatalogViewerTabParamsDto extends TabParamsDtoWithConnection {
    readonly catalogName: string
}
