import {
    JsonResultVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonResultVisualiserService'
import { HierarchyVisualiserService } from '@/modules/console/result-visualiser/service/HierarchyVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'

/**
 * Common abstract for all JSON-based hierarchy visualiser services.
 */
export abstract class JsonHierarchyVisualiserService<VS extends JsonResultVisualiserService> implements HierarchyVisualiserService {
    protected readonly visualiserService: VS

    protected constructor(visualiserService: VS) {
        this.visualiserService = visualiserService
    }

    findNamedHierarchiesByReferencesResults(hierarchyResult: Result, entitySchema: EntitySchema): [(ReferenceSchema | undefined), Result][] {
        const referencesWithHierarchies: [ReferenceSchema | undefined, Result][] = []
        for (const referenceName of Object.keys(hierarchyResult)) {
            const namedHierarchiesResult: Result = hierarchyResult[referenceName]
            if (referenceName === 'self') {
                referencesWithHierarchies.push([undefined, namedHierarchiesResult])
            } else {
                const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                    .getIfSupported()
                    ?.find(reference => reference.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase) === referenceName)
                if (referenceSchema == undefined) {
                    throw new UnexpectedError(`Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
                }
                referencesWithHierarchies.push([referenceSchema, namedHierarchiesResult])
            }
        }
        return referencesWithHierarchies
    }

    abstract resolveNamedHierarchy(namedHierarchyResult: Result[], entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy
}
