import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'

/**
 * Context of the entity viewer that influences how entity property values are printed (the entity grid passes it
 * to every cell, see `EntityPropertyValuePrinter`).
 */
export type EntityViewerPrintContext = {
    priceType?: QueryPriceMode
}
