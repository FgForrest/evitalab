import type { PriceHistogramResultParser } from '@/modules/console/result-visualiser/service/PriceHistogramResultParser'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'

/**
 * {@link PriceHistogramResultParser} for EvitaQL query language.
 */
export class EvitaQLPriceHistogramResultParser implements PriceHistogramResultParser<EvitaResponse> {

    parse(queryResult: EvitaResponse): VisualisedHistogram {
        return VisualisedHistogram.fromInternal(queryResult.extraResults!.priceHistogram!)
    }
}
