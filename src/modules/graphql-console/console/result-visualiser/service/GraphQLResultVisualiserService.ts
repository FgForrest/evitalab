import {
    GraphQLFacetSummaryVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLFacetSummaryVisualiserService'
import {
    GraphQLHierarchyVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLHierarchyVisualiserService'
import {
    GraphQLAttributeHistogramsVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLAttributeHistogramsVisualiserService'
import {
    GraphQLPriceHistogramVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLPriceHistogramVisualiserService'
import { InjectionKey } from 'vue'
import {
    JsonResultVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonResultVisualiserService'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { Connection } from '@/modules/connection/model/Connection'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { CatalogSchema } from '@/modules/connection/model/schema/CatalogSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import {
    FacetSummaryVisualiserService
} from '@/modules/console/result-visualiser/service/FacetSummaryVisualiserService'
import { HierarchyVisualiserService } from '@/modules/console/result-visualiser/service/HierarchyVisualiserService'
import {
    AttributeHistogramsVisualiserService
} from '@/modules/console/result-visualiser/service/AttributeHistogramsVisualiserService'
import {
    PriceHistogramVisualiserService
} from '@/modules/console/result-visualiser/service/PriceHistogramVisualiserService'
import { mandatoryInject } from '@/utils/reactivity'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'

export const graphQLResultVisualiserServiceInjectionKey: InjectionKey<GraphQLResultVisualiserService> = Symbol('graphQLResultVisualiserService')

/**
 * {@link ResultVisualiserService} for GraphQL query language.
 */
export class GraphQLResultVisualiserService extends JsonResultVisualiserService {

    private readonly connectionService: ConnectionService
    private facetSummaryVisualiserService: GraphQLFacetSummaryVisualiserService | undefined = undefined
    private hierarchyVisualiserService: GraphQLHierarchyVisualiserService | undefined = undefined
    private attributeHistogramsVisualiserService: GraphQLAttributeHistogramsVisualiserService | undefined = undefined
    private priceHistogramVisualiserService: GraphQLPriceHistogramVisualiserService | undefined = undefined

    constructor(connectionService: ConnectionService) {
        super()
        this.connectionService = connectionService
    }

    supportsMultipleQueries(): boolean {
        return true
    }

    findQueries(inputQuery: string, result: Result): string[] {
        if (result == undefined) {
            return []
        }
        const dataResult: Result | undefined = result['data']
        if (dataResult == undefined) {
            return []
        }
        // we currently support visualisations only of extra results, so we need only full queries
        return Object.keys(dataResult)
    }

    findQueryResult(result: Result, query: string): Result | undefined {
        const dataResult: Result | undefined = result['data']
        if (dataResult == undefined) {
            return undefined
        }
        return dataResult[query]
    }

    async getEntitySchemaForQuery(query: string, connection: Connection, catalogName: string): Promise<EntitySchema | undefined> {
        const entityType: string = (query).replace(/^(get|list|query)/, '')
        if (entityType.toLowerCase() === this.genericEntityType) {
            // generic query, no specific collection for all returned entities (each entity may be from a different collection)
            return undefined
        }
        const catalogSchema: CatalogSchema = await this.connectionService.getCatalogSchema(connection, catalogName)
        const entitySchema: EntitySchema | undefined = (await catalogSchema.entitySchemas())
            .getIfSupported()
            ?.find(it => it.nameVariants
                .getIfSupported()
                ?.get(NamingConvention.PascalCase) === entityType)
        if (entitySchema == undefined) {
            throw new UnexpectedError(`Entity schema '${entityType}' not found in catalog '${catalogName}'.`)
        }
        return entitySchema
    }

    resolveRepresentativeTitleForEntityResult(entityResult: Result | undefined, representativeAttributes: string[]): string | undefined {
        if (!entityResult) {
            return undefined
        }

        const possibleAttributes: [any, boolean][] = []
        const attributes = entityResult['attributes'] || {}
        for (const attributeName in attributes) {
            possibleAttributes.push([attributes[attributeName], representativeAttributes.includes(attributeName)])
        }

        if (possibleAttributes.length === 0) {
            return undefined
        } else if (possibleAttributes.length <= 3) {
            return possibleAttributes.map(it => this.toPrintableAttributeValue(it[0])).join(', ')
        } else {
            // if there are too many attributes, we only print the representative ones
            return possibleAttributes
                .filter(it => it[1])
                .map(it => this.toPrintableAttributeValue(it[0]))
                .join(', ')
        }
    }

    getFacetSummaryService(): FacetSummaryVisualiserService {
        if (!this.facetSummaryVisualiserService) {
            this.facetSummaryVisualiserService = new GraphQLFacetSummaryVisualiserService(this)
        }
        return this.facetSummaryVisualiserService
    }

    getHierarchyService(): HierarchyVisualiserService {
        if (!this.hierarchyVisualiserService) {
            this.hierarchyVisualiserService = new GraphQLHierarchyVisualiserService(this)
        }
        return this.hierarchyVisualiserService
    }

    getAttributeHistogramsService(): AttributeHistogramsVisualiserService {
        if (!this.attributeHistogramsVisualiserService) {
            this.attributeHistogramsVisualiserService = new GraphQLAttributeHistogramsVisualiserService(this)
        }
        return this.attributeHistogramsVisualiserService
    }

    getPriceHistogramService(): PriceHistogramVisualiserService {
        if (!this.priceHistogramVisualiserService) {
            this.priceHistogramVisualiserService = new GraphQLPriceHistogramVisualiserService(this)
        }
        return this.priceHistogramVisualiserService
    }
}

export const useGraphQLResultVisualiserService = (): GraphQLResultVisualiserService => {
    return mandatoryInject(graphQLResultVisualiserServiceInjectionKey) as GraphQLResultVisualiserService
}
