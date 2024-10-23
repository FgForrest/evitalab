import {
    GraphQLResultVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import {
    JsonFacetSummaryVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonFacetSummaryVisualiserService'

/**
 * {@link FacetSummaryVisualiserService} for GraphQL query language.
 */
export class GraphQLFacetSummaryVisualiserService extends JsonFacetSummaryVisualiserService<GraphQLResultVisualiserService> {
    constructor(visualiserService: GraphQLResultVisualiserService) {
        super(visualiserService)
    }
}
