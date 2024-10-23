import { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'

/**
 * Service for visualising raw JSON hierarchies.
 */
export interface HierarchyVisualiserService {
    /**
     * Tries to find references with named hierarchies results in the hierarchy result.
     */
    findNamedHierarchiesByReferencesResults(hierarchyResult: Result, entitySchema: EntitySchema): [ReferenceSchema | undefined, Result][]

    /**
     * Resolves visualisable named hierarchy from the named hierarchy result.
     */
    resolveNamedHierarchy(namedHierarchyResult: Result, entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy
}
