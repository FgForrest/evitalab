import type { AttributeHistogramsResultParser } from '@/modules/console/result-visualiser/service/AttributeHistogramsResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedAttributeHistograms,
    VisualisedAttributeHistogram
} from '@/modules/console/result-visualiser/model/histogram/VisualisedAttributeHistograms'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'

/**
 * {@link AttributeHistogramsResultParser} for GraphQL query language. Converts JSON histogram objects
 * and matches attribute keys to schemas.
 */
export class GraphQLAttributeHistogramsResultParser implements AttributeHistogramsResultParser {

    parse(queryResult: unknown, entitySchema: EntitySchema): VisualisedAttributeHistograms {
        const result = queryResult as any
        const histogramsResult = result['extraResults']?.['attributeHistogram']
        if (!histogramsResult) {
            return new VisualisedAttributeHistograms([])
        }

        const histograms: VisualisedAttributeHistogram[] = []
        for (const attributeName of Object.keys(histogramsResult)) {
            const attributeSchema = findSchemaByName(
                attributeName,
                entitySchema.attributes.values(),
                entitySchema.name,
                'Attribute'
            )
            const histogram = VisualisedHistogram.fromJson(histogramsResult[attributeName])
            histograms.push(new VisualisedAttributeHistogram(attributeSchema, histogram))
        }

        return new VisualisedAttributeHistograms(histograms)
    }
}
