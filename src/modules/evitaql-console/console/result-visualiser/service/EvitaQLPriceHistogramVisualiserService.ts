import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import type { PriceHistogramVisualiserService } from '@/modules/console/result-visualiser/service/PriceHistogramVisualiserService'
import { Histogram } from '@/modules/database-driver/request-response/data/Histogram'

/**
 * {@link PriceHistogramVisualiserService} for EvitaQL query language.
 */
export class EvitaQLPriceHistogramVisualiserService implements PriceHistogramVisualiserService {
    constructor() {

    }
    resolvePriceHistogram(priceHistogramResult: Histogram): VisualisedHistogram {
        return VisualisedHistogram.fromInternal(priceHistogramResult)
    }
}
