import type { PriceHistogramResultParser } from '@/modules/console/result-visualiser/service/PriceHistogramResultParser'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'

/**
 * {@link PriceHistogramResultParser} for GraphQL query language.
 */
export class GraphQLPriceHistogramResultParser implements PriceHistogramResultParser {

    parse(queryResult: unknown): VisualisedHistogram {
        const result = queryResult as any
        return VisualisedHistogram.fromJson(result['extraResults']['priceHistogram'])
    }
}
