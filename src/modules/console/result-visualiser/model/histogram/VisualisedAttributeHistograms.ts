import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { VisualisedHistogram } from './VisualisedHistogram'

/**
 * Fully resolved attribute histograms extra results DTO ready for visualisation.
 */
export class VisualisedAttributeHistograms {
    readonly histograms: VisualisedAttributeHistogram[]

    constructor(histograms: VisualisedAttributeHistogram[]) {
        this.histograms = histograms
    }
}

/**
 * A single attribute histogram pairing the attribute schema with its resolved histogram.
 */
export class VisualisedAttributeHistogram {
    readonly attributeSchema: AttributeSchema
    readonly histogram: VisualisedHistogram

    constructor(attributeSchema: AttributeSchema, histogram: VisualisedHistogram) {
        this.attributeSchema = attributeSchema
        this.histogram = histogram
    }
}
