import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'

/**
 * Passes context arguments to {@link EntityPropertyValue.toPreviewString} method to possibly influence the output.
 */
export type EntityPropertyValuePreviewStringContext = {
    priceType?: QueryPriceMode
}
