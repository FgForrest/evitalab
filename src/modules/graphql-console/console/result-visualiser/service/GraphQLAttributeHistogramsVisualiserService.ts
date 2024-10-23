import {
    GraphQLResultVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import {
    JsonAttributeHistogramsVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonAttributeHistogramsVisualiserService'

/**
 * {@link AttributeHistogramsVisualiserService} for GraphQL query language.
 */
export class GraphQLAttributeHistogramsVisualiserService extends JsonAttributeHistogramsVisualiserService<GraphQLResultVisualiserService> {
    constructor(visualiserService: GraphQLResultVisualiserService) {
        super(visualiserService)
    }
}
