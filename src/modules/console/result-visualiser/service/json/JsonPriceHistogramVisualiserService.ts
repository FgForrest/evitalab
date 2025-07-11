// todo docs
import {
    JsonResultVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonResultVisualiserService'
import type {
    PriceHistogramVisualiserService
} from '@/modules/console/result-visualiser/service/PriceHistogramVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'

export abstract class JsonPriceHistogramVisualiserService<VS extends JsonResultVisualiserService> implements PriceHistogramVisualiserService {
    protected readonly visualiserService: VS

    protected constructor(visualiserService: VS) {
        this.visualiserService = visualiserService
    }

    resolvePriceHistogram(priceHistogramResult: Result): VisualisedHistogram {
        return VisualisedHistogram.fromJson(priceHistogramResult)
    }
}
