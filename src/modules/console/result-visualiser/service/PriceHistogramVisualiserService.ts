import { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'

/**
 * Service for visualising raw JSON price histograms.
 */
export interface PriceHistogramVisualiserService {

    /**
     * Resolves visualisable price histogram from the price histogram result.
     */
    resolvePriceHistogram(priceHistogramResult: Result): VisualisedHistogram
}
