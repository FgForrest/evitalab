import {
    JsonResultVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonResultVisualiserService'
import { HierarchyVisualiserService } from '@/modules/console/result-visualiser/service/HierarchyVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import Immutable from 'immutable'

/**
 * Common abstract for all JSON-based hierarchy visualiser services.
 */
export abstract class JsonHierarchyVisualiserService<VS extends JsonResultVisualiserService> implements HierarchyVisualiserService {
    protected readonly visualiserService: VS

    protected constructor(visualiserService: VS) {
        this.visualiserService = visualiserService
    }

    findNamedHierarchiesByReferencesResults(hierarchyResult: Result,
                                            entitySchema: EntitySchema): [(ReferenceSchema | undefined), Result][] {
        const referencesWithHierarchies: [ReferenceSchema | undefined, Result][] = []
        for (const referenceName of Object.keys(hierarchyResult)) {
            const namedHierarchiesResult: Result = hierarchyResult[referenceName]
            const convertedNamedHierarchiesResult: Map<string, Result> = new Map()
            for (const name of Object.keys(namedHierarchiesResult)) {
                const hierarchy: Result = namedHierarchiesResult[name]
                convertedNamedHierarchiesResult.set(name, hierarchy)
            }

            if (referenceName === 'self') {
                referencesWithHierarchies.push([undefined, Immutable.Map(convertedNamedHierarchiesResult)])
            } else {
                const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                    .find(reference => reference.nameVariants
                        .get(NamingConvention.CamelCase) === referenceName)
                if (referenceSchema == undefined) {
                    throw new UnexpectedError(`Reference '${referenceName}' not found in entity '${entitySchema.name}'.`)
                }
                referencesWithHierarchies.push([referenceSchema, Immutable.Map(convertedNamedHierarchiesResult)])
            }
        }
        return referencesWithHierarchies
    }

    abstract resolveNamedHierarchy(namedHierarchyResult: Result[], entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy
}
