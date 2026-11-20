import type { AttributeHistogramsResultParser } from '@/modules/console/result-visualiser/service/AttributeHistogramsResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedAttributeHistogram,
    VisualisedAttributeHistograms
} from '@/modules/console/result-visualiser/model/histogram/VisualisedAttributeHistograms'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'

/**
 * {@link AttributeHistogramsResultParser} for the REST API. Histograms are keyed by the camelCase attribute name.
 */
export class RestAttributeHistogramsResultParser implements AttributeHistogramsResultParser {

    parse(queryResult: unknown, entitySchema: EntitySchema): VisualisedAttributeHistograms {
        const histogramsResult: RestResultNode | undefined =
            (queryResult as RestResultNode)['extraResults']?.['attributeHistogram']
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
            histograms.push(new VisualisedAttributeHistogram(
                attributeSchema,
                VisualisedHistogram.fromJson(histogramsResult[attributeName])
            ))
        }
        return new VisualisedAttributeHistograms(histograms)
    }
}
