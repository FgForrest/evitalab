import { Histogram } from '@/modules/connection/model/data/Histogram'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { PriceHistogramVisualiserService } from '@/modules/console/result-visualiser/service/PriceHistogramVisualiserService'

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
