import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualiserType } from '@/modules/console/result-visualiser/model/VisualiserType'
import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'

/**
 * Common abstract for all JSON-based result visualiser services.
 */
export abstract class JsonResultVisualiserService extends ResultVisualiserService {

    protected readonly genericEntityType: string = 'entity'

    /**
     * Resolves human-readable string representation of an entity.
     */
    abstract resolveRepresentativeTitleForEntityResult(entityResult: Result, representativeAttributes: string[]): string | undefined

    findVisualiserTypes(queryResult: Result): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []
        const extraResults = (queryResult as { extraResults?: Record<string, unknown> })['extraResults']
        // todo lho i18n, sync with EvitaQLResultVisualiserService?
        if (extraResults) {
            if (extraResults['facetSummary']) {
                visualiserTypes.push(new VisualiserType(
                    'Facet summary',
                    VisualiserTypeType.FacetSummary
                ))
            }
            if (extraResults['hierarchy']) {
                visualiserTypes.push(new VisualiserType(
                    'Hierarchy',
                    VisualiserTypeType.Hierarchy
                ))
            }
            if (extraResults['attributeHistogram']) {
                visualiserTypes.push(new VisualiserType(
                    'Attribute histograms',
                    VisualiserTypeType.AttributeHistograms
                ))
            }
            if (extraResults['priceHistogram']) {
                visualiserTypes.push(new VisualiserType(
                    'Price histogram',
                    VisualiserTypeType.PriceHistogram
                ))
            }
        }

        return visualiserTypes
    }

    findResultForVisualiser(queryResult: Result, visualiserType: string): Result {
        const extraResults = (queryResult as { extraResults?: Record<string, unknown> })['extraResults']
        if (extraResults) {
            switch (visualiserType as VisualiserTypeType) {
                case VisualiserTypeType.FacetSummary:
                    return extraResults['facetSummary']
                case VisualiserTypeType.Hierarchy:
                    return extraResults['hierarchy']
                case VisualiserTypeType.AttributeHistograms:
                    return extraResults['attributeHistogram']
                case VisualiserTypeType.PriceHistogram:
                    return extraResults['priceHistogram']
                default:
                    return undefined
            }
        }
        return undefined
    }
}
