import {
    JsonResultVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonResultVisualiserService'
import {
    AttributeHistogramsVisualiserService
} from '@/modules/console/result-visualiser/service/AttributeHistogramsVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'

/**
 * Common abstract for all JSON-based attribute histogram visualiser services.
 */
export abstract class JsonAttributeHistogramsVisualiserService<VS extends JsonResultVisualiserService> implements AttributeHistogramsVisualiserService {
    protected readonly visualiserService: VS

    protected constructor(visualiserService: VS) {
        this.visualiserService = visualiserService
    }

    resolveAttributeHistogramsByAttributes(attributeHistogramsResult: Result, entitySchema: EntitySchema): [AttributeSchema, VisualisedHistogram][] {
        const attributeHistograms: [AttributeSchema, VisualisedHistogram][] = []
        for (const attributeName of Object.keys(attributeHistogramsResult)) {
            const attributeSchema: AttributeSchema | undefined = entitySchema.attributes
                .getIfSupported()
                ?.find(attribute => attribute.nameVariants
                    .getIfSupported()
                    ?.get(NamingConvention.CamelCase) === attributeName)
            if (attributeSchema == undefined) {
                throw new UnexpectedError(`Attribute '${attributeName}' not found in entity '${entitySchema.name}'.`)
            }
            const histogramResult: Result = attributeHistogramsResult[attributeName]
            attributeHistograms.push([attributeSchema, VisualisedHistogram.fromJson(histogramResult)])
        }
        return attributeHistograms
    }
}
