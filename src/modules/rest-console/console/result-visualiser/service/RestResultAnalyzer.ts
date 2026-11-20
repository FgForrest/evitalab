import type { ResultAnalyzer } from '@/modules/console/result-visualiser/service/ResultAnalyzer'
import { AnalyzedQuery, AnalyzedResult } from '@/modules/console/result-visualiser/model/AnalyzedResult'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'
import { resolveRestQueryCollection } from '@/modules/rest-console/console/result-visualiser/service/resolveRestQueryCollection'

/**
 * {@link ResultAnalyzer} for the REST API. A REST response belongs to exactly one operation, so there is a single
 * analyzed query; its entity schema is derived from the **path template** of the executed operation (passed as the
 * input query), whose collection segment is the PascalCase name variant of the entity type.
 */
export class RestResultAnalyzer implements ResultAnalyzer {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    supportsMultipleQueries(): boolean {
        return false
    }

    async analyze(inputQuery: string, rawResult: unknown, catalogName: string): Promise<AnalyzedResult> {
        const collectionName: string | undefined = resolveRestQueryCollection(inputQuery)
        if (collectionName == undefined || rawResult == undefined || typeof rawResult !== 'object') {
            return new AnalyzedResult([])
        }
        const result: RestResultNode = rawResult as RestResultNode
        const entitySchema: EntitySchema = await this.getEntitySchema(collectionName, catalogName)
        return new AnalyzedResult([
            new AnalyzedQuery(`query${collectionName}`, entitySchema, this.findVisualiserTypes(result), result)
        ])
    }

    private async getEntitySchema(collectionName: string, catalogName: string): Promise<EntitySchema> {
        const catalogSchema: CatalogSchema = await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getCatalogSchema()
        )
        const entitySchema: EntitySchema | undefined = (await catalogSchema.entitySchemas())
            .find(it => it.nameVariants.get(NamingConvention.PascalCase) === collectionName)
        if (entitySchema == undefined) {
            throw new UnexpectedError(`Entity schema '${collectionName}' not found in catalog '${catalogName}'.`)
        }
        return entitySchema
    }

    private findVisualiserTypes(result: RestResultNode): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []
        const extraResults: RestResultNode | undefined = result['extraResults']
        if (extraResults == undefined) {
            return visualiserTypes
        }
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
        // REST returns the telemetry as the root step object, never as a list
        const queryTelemetry: unknown = extraResults['queryTelemetry']
        if (queryTelemetry != undefined && typeof queryTelemetry === 'object' && !Array.isArray(queryTelemetry)) {
            visualiserTypes.push(new VisualiserType('Query telemetry', VisualiserTypeType.QueryTelemetry))
        }
        return visualiserTypes
    }
}
