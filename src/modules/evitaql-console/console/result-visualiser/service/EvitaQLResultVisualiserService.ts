import { InjectionKey } from 'vue'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
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
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { Entity } from '@/modules/connection/model/data/Entity'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'
import { ExtraResults } from '@/modules/connection/model/data/ExtraResults'
import { Attributes } from '@/modules/connection/model/data/Attributes'
import { Response } from '@/modules/connection/model/data/Response'
import Immutable from 'immutable'

export const evitaQLResultVisualiserServiceInjectionKey: InjectionKey<EvitaQLResultVisualiserService> =
    Symbol('evitaQLResultViewerService')

/**
 * {@link ResultVisualiserService} for evitaQL query language.
 */
export class EvitaQLResultVisualiserService extends ResultVisualiserService {
    protected readonly genericEntityType: string = 'entity'

    private readonly collectionConstraintPattern: RegExp =
        /collection\(\s*['"]([A-Za-z0-9_.\-~]*)['"]\s*\)/

    private readonly connectionService: ConnectionService
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

    constructor(connectionService: ConnectionService) {
        super()
        this.connectionService = connectionService
    }

    findVisualiserTypes(queryResult: Result): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []

        const extraResults = (queryResult as Response).extraResults.getOrElse(
            undefined
        )
        if (extraResults != undefined) {
            // todo lho i18n
            if (extraResults.facetGroupStatistics.isSupported() &&
                extraResults.facetGroupStatistics.getOrElse(undefined) != undefined) {
                visualiserTypes.push(new VisualiserType(
                    'Facet summary',
                    VisualiserTypeType.FacetSummary
                ))
            }
            if (extraResults.hierarchy.isSupported() &&
                extraResults.hierarchy.getOrElse(undefined) != undefined) {
                visualiserTypes.push(new VisualiserType(
                    'Hierarchy',
                    VisualiserTypeType.Hierarchy
                ))
            }
            if (extraResults.attributeHistogram.isSupported() &&
                extraResults.attributeHistogram.getOrElse(undefined) != undefined) {
                visualiserTypes.push(new VisualiserType(
                    'Attribute histograms',
                    VisualiserTypeType.AttributeHistograms
                ))
            }
            if (extraResults.priceHistogram.isSupported() &&
                extraResults.priceHistogram.getOrElse(undefined) != undefined) {
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
            queryResult as Response
        ).extraResults.getIfSupported()
        if (res) {
            switch (visualiserType) {
                case VisualiserTypeType.FacetSummary:
                    return res.facetGroupStatistics.getOrThrow()
                case VisualiserTypeType.Hierarchy:
                    return res.hierarchy.getOrThrow()
                case VisualiserTypeType.AttributeHistograms:
                    return res.attributeHistogram.getOrThrow()
                case VisualiserTypeType.PriceHistogram:
                    return res.priceHistogram.getOrThrow()
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
        connection: Connection,
        catalogName: string
    ): Promise<EntitySchema | undefined> {
        const entityType: string = query
        if (entityType.toLowerCase() === this.genericEntityType) {
            return undefined
        }
        const catalogSchema: CatalogSchema =
            await this.connectionService.getCatalogSchema(
                connection,
                catalogName
            )
        const entitySchema: EntitySchema | undefined = (
            await catalogSchema.entitySchemas()
        )
            .getIfSupported()
            ?.find(
                (it) =>
                    it.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.PascalCase) === entityType
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
}

export const useEvitaQLResultVisualiserService =
    (): EvitaQLResultVisualiserService => {
        return mandatoryInject(
            evitaQLResultVisualiserServiceInjectionKey
        ) as EvitaQLResultVisualiserService
    }
