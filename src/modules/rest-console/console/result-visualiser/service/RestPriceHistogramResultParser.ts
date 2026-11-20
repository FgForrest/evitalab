import type { PriceHistogramResultParser } from '@/modules/console/result-visualiser/service/PriceHistogramResultParser'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'

/**
 * {@link PriceHistogramResultParser} for the REST API.
 */
export class RestPriceHistogramResultParser implements PriceHistogramResultParser {

    parse(queryResult: unknown): VisualisedHistogram {
        return VisualisedHistogram.fromJson((queryResult as RestResultNode)['extraResults']['priceHistogram'])
    }
}
