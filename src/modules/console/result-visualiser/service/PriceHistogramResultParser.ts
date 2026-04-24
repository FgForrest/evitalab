import { VisualisedHistogram } from '../model/histogram/VisualisedHistogram'

/**
 * Parses price histogram extra results into a fully resolved {@link VisualisedHistogram} DTO.
 * Synchronous — no entity title resolution needed.
 */
export interface PriceHistogramResultParser<TQueryResult = unknown> {
    parse(queryResult: TQueryResult): VisualisedHistogram
}
