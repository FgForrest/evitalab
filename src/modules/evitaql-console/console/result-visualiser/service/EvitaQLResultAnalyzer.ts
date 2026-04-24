import type { ResultAnalyzer } from '@/modules/console/result-visualiser/service/ResultAnalyzer'
import { AnalyzedResult, AnalyzedQuery } from '@/modules/console/result-visualiser/model/AnalyzedResult'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'

/**
 * {@link ResultAnalyzer} for EvitaQL query language. Extracts entity type from the
 * `collection('...')` constraint in the input query and inspects typed extra results.
 */
export class EvitaQLResultAnalyzer implements ResultAnalyzer<EvitaResponse> {

    private readonly genericEntityType: string = 'entity'
    private readonly collectionConstraintPattern: RegExp =
        /collection\(\s*['"]([A-Za-z0-9_.\-~]*)['"]\s*\)/
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    supportsMultipleQueries(): boolean {
        return false
    }

    async analyze(inputQuery: string, rawResult: EvitaResponse, catalogName: string): Promise<AnalyzedResult> {
        const entityType: string | undefined = this.collectionConstraintPattern.exec(inputQuery)?.[1]
        if (entityType == undefined) {
            throw new UnexpectedError('No entity type present in query.')
        }

        const entitySchema = await this.getEntitySchemaForQuery(entityType, catalogName)
        const visualiserTypes = this.findVisualiserTypes(rawResult)

        return new AnalyzedResult([
            new AnalyzedQuery(entityType, entitySchema, visualiserTypes, rawResult)
        ])
    }

    private async getEntitySchemaForQuery(entityType: string, catalogName: string): Promise<EntitySchema | undefined> {
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
            throw new UnexpectedError(
                `Entity schema '${entityType}' not found in catalog '${catalogName}'.`
            )
        }
        return entitySchema
    }

    private findVisualiserTypes(rawResult: EvitaResponse): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []

        const extraResults = rawResult.extraResults
        if (extraResults != undefined) {
            if (extraResults.facetGroupStatistics != undefined) {
                visualiserTypes.push(new VisualiserType('Facet summary', VisualiserTypeType.FacetSummary))
            }
            if (extraResults.hierarchy != undefined || extraResults.selfHierarchy != undefined) {
                visualiserTypes.push(new VisualiserType('Hierarchy', VisualiserTypeType.Hierarchy))
            }
            if (extraResults.attributeHistogram != undefined) {
                visualiserTypes.push(new VisualiserType('Attribute histograms', VisualiserTypeType.AttributeHistograms))
            }
            if (extraResults.priceHistogram != undefined) {
                visualiserTypes.push(new VisualiserType('Price histogram', VisualiserTypeType.PriceHistogram))
            }
        }

        return visualiserTypes
    }
}
