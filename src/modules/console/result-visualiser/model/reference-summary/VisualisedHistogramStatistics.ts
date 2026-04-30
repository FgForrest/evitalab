import { VisualisedHistogram } from '../histogram/VisualisedHistogram'

/**
 * Pairs a histogram index name with its visualised histogram within a reference group.
 */
export class VisualisedHistogramStatistics {
    readonly indexName: string
    readonly histogram: VisualisedHistogram

    constructor(indexName: string, histogram: VisualisedHistogram) {
        this.indexName = indexName
        this.histogram = histogram
    }
}
