import {
    GraphQLResultVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import {
    JsonPriceHistogramVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonPriceHistogramVisualiserService'

/**
 * {@link PriceHistogramVisualiserService} for GraphQL query language.
 */
export class GraphQLPriceHistogramVisualiserService extends JsonPriceHistogramVisualiserService<GraphQLResultVisualiserService> {
    constructor(visualiserService: GraphQLResultVisualiserService) {
        super(visualiserService)
    }
}
