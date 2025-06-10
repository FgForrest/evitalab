import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
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
