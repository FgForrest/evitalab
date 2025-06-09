import type { InjectionKey } from 'vue'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { EvitaQLFacetSummaryVisualiserService } from './EvitaQLFacetSummaryVisualiserService'
import {
    EvitaQLHierarchyVisualiserService
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLHierarchyVisualiserService'
import {
    EvitaQLAttributeHistogramsVisualiserService
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLAttributeHistogramsVisualiserService'
import {
    EvitaQLPriceHistogramVisualiserService
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLPriceHistogramVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type {
    FacetSummaryVisualiserService
} from '@/modules/console/result-visualiser/service/FacetSummaryVisualiserService'
import type { HierarchyVisualiserService } from '@/modules/console/result-visualiser/service/HierarchyVisualiserService'
import type {
    AttributeHistogramsVisualiserService
} from '@/modules/console/result-visualiser/service/AttributeHistogramsVisualiserService'
import type {
    PriceHistogramVisualiserService
} from '@/modules/console/result-visualiser/service/PriceHistogramVisualiserService'
import { mandatoryInject } from '@/utils/reactivity'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { ExtraResults } from '@/modules/database-driver/request-response/data/ExtraResults'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'

export const evitaQLResultVisualiserServiceInjectionKey: InjectionKey<EvitaQLResultVisualiserService> =
    Symbol('evitaQLResultViewerService')

/**
 * {@link ResultVisualiserService} for evitaQL query language.
 */
export class EvitaQLResultVisualiserService extends ResultVisualiserService {
    protected readonly genericEntityType: string = 'entity'

    private readonly collectionConstraintPattern: RegExp =
        /collection\(\s*['"]([A-Za-z0-9_.\-~]*)['"]\s*\)/

    private readonly evitaClient: EvitaClient
    private facetSummaryVisualiserService:
        | EvitaQLFacetSummaryVisualiserService
        | undefined = undefined
    private hierarchyVisualiserService:
        | EvitaQLHierarchyVisualiserService
        | undefined = undefined
    private attributeHistogramsVisualiserService:
        | EvitaQLAttributeHistogramsVisualiserService
        | undefined = undefined
    private priceHistogramVisualiserService:
        | EvitaQLPriceHistogramVisualiserService
        | undefined = undefined

    constructor(evitaClient: EvitaClient) {
        super()
        this.evitaClient = evitaClient
    }

    findVisualiserTypes(queryResult: Result): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []

        const extraResults = (queryResult as EvitaResponse).extraResults
        if (extraResults != undefined) {
            // todo lho i18n
            if (extraResults.facetGroupStatistics != undefined) {
                visualiserTypes.push(new VisualiserType(
                    'Facet summary',
                    VisualiserTypeType.FacetSummary
                ))
            }
            if (extraResults.hierarchy != undefined) {
                visualiserTypes.push(new VisualiserType(
                    'Hierarchy',
                    VisualiserTypeType.Hierarchy
                ))
            }
            if (extraResults.attributeHistogram != undefined) {
                visualiserTypes.push(new VisualiserType(
                    'Attribute histograms',
                    VisualiserTypeType.AttributeHistograms
                ))
            }
            if (extraResults.priceHistogram != undefined) {
                visualiserTypes.push(new VisualiserType(
                    'Price histogram',
                    VisualiserTypeType.PriceHistogram
                ))
            }
        }

        return visualiserTypes
    }

    findResultForVisualiser(
        queryResult: Result,
        visualiserType: string
    ): Result | undefined {
        const res: ExtraResults | undefined = (
            queryResult as EvitaResponse
        ).extraResults
        if (res != undefined) {
            switch (visualiserType) {
                case VisualiserTypeType.FacetSummary:
                    return res.facetGroupStatistics
                case VisualiserTypeType.Hierarchy:
                    return res.hierarchy
                case VisualiserTypeType.AttributeHistograms:
                    return res.attributeHistogram
                case VisualiserTypeType.PriceHistogram:
                    return res.priceHistogram
                default:
                    return undefined
            }
        }
        return undefined
    }


    supportsMultipleQueries(): boolean {
        return false
    }

    findQueries(inputQuery: string, result: Result): string[] {
        const entityType: string | undefined = this.collectionConstraintPattern.exec(inputQuery)?.[1]
        if (entityType == undefined) {
            throw new UnexpectedError('No entity type present in query.')
        } else {
            return [entityType]
        }
    }

    findQueryResult(result: Result, query: string): Result | undefined {
        return result
    }

    async getEntitySchemaForQuery(
        query: string,
        catalogName: string
    ): Promise<EntitySchema | undefined> {
        const entityType: string = query
        if (entityType.toLowerCase() === this.genericEntityType) {
            return undefined
        }
        const catalogSchema: CatalogSchema = await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getCatalogSchema()
        )
        const entitySchema: EntitySchema | undefined = (
            await catalogSchema.entitySchemas()
        )
            .find(
                (it) =>
                    it.nameVariants.get(NamingConvention.PascalCase) === entityType
            )
        if (entitySchema == undefined) {
            throw new UnexpectedError(
                `Entity schema '${entityType}' not found in catalog '${catalogName}'.`
            )
        }
        return entitySchema
    }

    resolveRepresentativeTitleForEntityResult(
        entityResultValue: Entity | undefined,
        representativeAttributes: string[]
    ): string | undefined {
        if (!entityResultValue) {
            return undefined
        }

        const entityResult: Entity = entityResultValue as Entity

        const possibleAttributes: [any, boolean][] = []

        entityResult.allAttributes.forEach(it => {
            // todo lho there can be legitimately more locales, we need to look for the entityLocaleEquals if there are multiple locales
            possibleAttributes.push([
                it.value,
                representativeAttributes.includes(it.name)
            ])
        })

        if (possibleAttributes.length === 0) {
            return undefined
        } else if (possibleAttributes.length <= 3) {
            return possibleAttributes
                .map((it) => this.toPrintableAttributeValue(it[0]))
                .join(', ')
        } else {
            // if there are too many attributes, we only print the representative ones
            return possibleAttributes
                .filter((it) => it[1])
                .map((it) => this.toPrintableAttributeValue(it[0]))
                .join(', ')
        }
    }

    getFacetSummaryService(): FacetSummaryVisualiserService {
        if (!this.facetSummaryVisualiserService) {
            this.facetSummaryVisualiserService =
                new EvitaQLFacetSummaryVisualiserService(this)
        }
        return this.facetSummaryVisualiserService
    }

    getHierarchyService(): HierarchyVisualiserService {
        if (!this.hierarchyVisualiserService) {
            this.hierarchyVisualiserService =
                new EvitaQLHierarchyVisualiserService(this)
        }
        return this.hierarchyVisualiserService
    }

    getAttributeHistogramsService(): AttributeHistogramsVisualiserService {
        if (!this.attributeHistogramsVisualiserService) {
            this.attributeHistogramsVisualiserService =
                new EvitaQLAttributeHistogramsVisualiserService()
        }
        return this.attributeHistogramsVisualiserService
    }

    getPriceHistogramService(): PriceHistogramVisualiserService {
        if (!this.priceHistogramVisualiserService) {
            this.priceHistogramVisualiserService =
                new EvitaQLPriceHistogramVisualiserService()
        }
        return this.priceHistogramVisualiserService
    }

    async resolveRepresentativeAttributes(catalogName: string, entityType: string): Promise<string[]> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            async session => {
                const entitySchema: EntitySchema = await session.getEntitySchemaOrThrowException(entityType)
                return Array.from(entitySchema.attributes.values())
                    .filter(attributeSchema => attributeSchema.representative)
                    .map(attributeSchema => attributeSchema.nameVariants.get(NamingConvention.CamelCase)!)
            }
        )
    }
}

export const useEvitaQLResultVisualiserService =
    (): EvitaQLResultVisualiserService => {
        return mandatoryInject(
            evitaQLResultVisualiserServiceInjectionKey
        ) as EvitaQLResultVisualiserService
    }
