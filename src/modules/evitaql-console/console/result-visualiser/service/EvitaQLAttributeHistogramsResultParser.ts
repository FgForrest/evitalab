import type { AttributeHistogramsResultParser } from '@/modules/console/result-visualiser/service/AttributeHistogramsResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedAttributeHistograms,
    VisualisedAttributeHistogram
} from '@/modules/console/result-visualiser/model/histogram/VisualisedAttributeHistograms'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'

/**
 * {@link AttributeHistogramsResultParser} for EvitaQL query language. Converts typed
 * {@link Histogram} objects from the internal model.
 */
export class EvitaQLAttributeHistogramsResultParser implements AttributeHistogramsResultParser<EvitaResponse> {

    parse(queryResult: EvitaResponse, entitySchema: EntitySchema): VisualisedAttributeHistograms {
        const attributeHistogramMap = queryResult.extraResults?.attributeHistogram
        if (attributeHistogramMap == undefined) {
            return new VisualisedAttributeHistograms([])
        }

        const histograms: VisualisedAttributeHistogram[] = []

        for (const [attributeName, histogram] of attributeHistogramMap) {
            const attributeSchema = entitySchema.attributes.get(attributeName)
            if (attributeSchema == undefined) {
                throw new UnexpectedError(`Attribute '${attributeName}' not found in entity '${entitySchema.name}'.`)
            }
            histograms.push(new VisualisedAttributeHistogram(attributeSchema, VisualisedHistogram.fromInternal(histogram)))
        }

        return new VisualisedAttributeHistograms(histograms)
    }
}
