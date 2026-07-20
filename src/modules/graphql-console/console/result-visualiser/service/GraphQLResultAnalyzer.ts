import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import type { ResultAnalyzer } from '@/modules/console/result-visualiser/service/ResultAnalyzer'
import { AnalyzedResult, AnalyzedQuery } from '@/modules/console/result-visualiser/model/AnalyzedResult'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'

/**
 * {@link ResultAnalyzer} for GraphQL query language. Extracts query names from `data` keys
 * and resolves entity schemas by stripping get/list/query prefixes.
 */
export class GraphQLResultAnalyzer implements ResultAnalyzer {

    private readonly genericEntityType: string = 'entity'
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    supportsMultipleQueries(): boolean {
        return true
    }

    async analyze(_inputQuery: string, rawResult: unknown, catalogName: string): Promise<AnalyzedResult> {
        const result = rawResult as GraphQLResultNode
        if (result == undefined) {
            return new AnalyzedResult([])
        }
        const dataResult = result['data']
        if (dataResult == undefined) {
            return new AnalyzedResult([])
        }

        const queryNames: string[] = Object.keys(dataResult)
        const queries: AnalyzedQuery[] = []

        for (const queryName of queryNames) {
            const queryResult = dataResult[queryName]
            const entitySchema = await this.getEntitySchemaForQuery(queryName, catalogName)
            const visualiserTypes = this.findVisualiserTypes(queryResult)

            queries.push(new AnalyzedQuery(
                queryName,
                entitySchema,
                visualiserTypes,
                queryResult
            ))
        }

        return new AnalyzedResult(queries)
    }

    private async getEntitySchemaForQuery(query: string, catalogName: string): Promise<EntitySchema | undefined> {
        const entityType: string = query.replace(/^(get|list|query)/, '')
        if (entityType.toLowerCase() === this.genericEntityType) {
            return undefined
        }
        const catalogSchema: CatalogSchema = await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getCatalogSchema()
        )
        const entitySchema: EntitySchema | undefined = (await catalogSchema.entitySchemas())
            .find(it => it.nameVariants.get(NamingConvention.PascalCase) === entityType)
        if (entitySchema == undefined) {
            throw new UnexpectedError(`Entity schema '${entityType}' not found in catalog '${catalogName}'.`)
        }
        return entitySchema
    }

    private findVisualiserTypes(queryResult: GraphQLResultNode): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []

        const extraResults = queryResult['extraResults']
        if (extraResults) {
            if (extraResults['facetSummary']) {
                visualiserTypes.push(new VisualiserType('Facet summary', VisualiserTypeType.FacetSummary))
            }
            if (extraResults['referenceSummary']) {
                visualiserTypes.push(new VisualiserType('Reference summary', VisualiserTypeType.ReferenceSummary))
            }
            if (extraResults['hierarchy']) {
                visualiserTypes.push(new VisualiserType('Hierarchy', VisualiserTypeType.Hierarchy))
            }
            if (extraResults['attributeHistogram']) {
                visualiserTypes.push(new VisualiserType('Attribute histograms', VisualiserTypeType.AttributeHistograms))
            }
            if (extraResults['priceHistogram']) {
                visualiserTypes.push(new VisualiserType('Price histogram', VisualiserTypeType.PriceHistogram))
            }
        }

        return visualiserTypes
    }
}
