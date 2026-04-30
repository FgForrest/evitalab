import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { VisualisedReferenceSummary } from '../model/reference-summary/VisualisedReferenceSummary'

export interface ReferenceSummaryResultParser<TQueryResult = unknown> {
    parse(queryResult: TQueryResult, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedReferenceSummary>
}
