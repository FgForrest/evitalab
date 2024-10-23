import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
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
    abstract resolveRepresentativeTitleForEntityResult(entityResult: Result | undefined, representativeAttributes: string[]): string | undefined

    findVisualiserTypes(queryResult: Result): VisualiserType[] {
        const visualiserTypes: VisualiserType[] = []

        const extraResults = queryResult['extraResults']
        if (extraResults) {
            if (extraResults['facetSummary']) {
                visualiserTypes.push({
                    title: 'Facet summary',
                    value: VisualiserTypeType.FacetSummary
                })
            }
            if (extraResults['hierarchy']) {
                visualiserTypes.push({
                    title: 'Hierarchy',
                    value: VisualiserTypeType.Hierarchy
                })
            }
            if (extraResults['attributeHistogram']) {
                visualiserTypes.push({
                    title: 'Attribute histograms',
                    value: VisualiserTypeType.AttributeHistograms
                })
            }
            if (extraResults['priceHistogram']) {
                visualiserTypes.push({
                    title: 'Price histogram',
                    value: VisualiserTypeType.PriceHistogram
                })
            }
        }

        return visualiserTypes
    }

    findResultForVisualiser(queryResult: Result, visualiserType: VisualiserTypeType): Result | undefined {
        switch (visualiserType) {
            case VisualiserTypeType.FacetSummary:
                return queryResult?.['extraResults']?.['facetSummary']
            case VisualiserTypeType.Hierarchy:
                return queryResult?.['extraResults']?.['hierarchy']
            case VisualiserTypeType.AttributeHistograms:
                return queryResult?.['extraResults']?.['attributeHistogram']
            case VisualiserTypeType.PriceHistogram:
                return queryResult?.['extraResults']?.['priceHistogram']
            default:
                return undefined
        }
    }
}
