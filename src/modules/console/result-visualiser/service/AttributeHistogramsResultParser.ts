import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { VisualisedAttributeHistograms } from '../model/histogram/VisualisedAttributeHistograms'

/**
 * Parses attribute histogram extra results into a fully resolved {@link VisualisedAttributeHistograms} DTO.
 * Synchronous — histograms don't reference other entities.
 */
export interface AttributeHistogramsResultParser<TQueryResult = unknown> {
    parse(queryResult: TQueryResult, entitySchema: EntitySchema): VisualisedAttributeHistograms
}
