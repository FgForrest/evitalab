import { AttributeHistogramsVisualiserService } from '@/modules/console/result-visualiser/service/AttributeHistogramsVisualiserService'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import Immutable from 'immutable'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Histogram } from '@/modules/database-driver/request-response/data/Histogram'

/**
 * {@link AttributeHistogramsVisualiserService} for EvitaQL query language.
 */
export class EvitaQLAttributeHistogramsVisualiserService
    implements AttributeHistogramsVisualiserService
{
    constructor() {}

    resolveAttributeHistogramsByAttributes(
        attributeHistogramsResult: Immutable.Map<string, Histogram>,
        entitySchema: EntitySchema
    ): [AttributeSchema, VisualisedHistogram][] {
        const newHistograms: [AttributeSchema, VisualisedHistogram][] = []

        for (const [attributeName, histogram] of attributeHistogramsResult) {
            const attributeSchema: AttributeSchema | undefined = entitySchema.attributes.get(attributeName)
            if (attributeSchema == undefined) {
                throw new UnexpectedError(`Attribute '${attributeName}' not found in entity '${entitySchema.name}'.`)
            }

            newHistograms.push([attributeSchema, VisualisedHistogram.fromInternal(histogram)])
        }

        return newHistograms
    }
}
