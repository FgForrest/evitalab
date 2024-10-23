import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'

/**
 * Service for visualising raw JSON attribute histograms.
 */
export interface AttributeHistogramsVisualiserService {

    /**
     * Resolves attribute histograms from the attribute histograms result.
     */
    resolveAttributeHistogramsByAttributes(attributeHistogramsResult: Result, entitySchema: EntitySchema): [AttributeSchema, VisualisedHistogram][]
}
