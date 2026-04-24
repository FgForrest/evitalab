import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { VisualisedNamedHierarchy } from './VisualisedNamedHierarchy'

/**
 * Fully resolved hierarchy extra results DTO ready for visualisation.
 * Contains all reference hierarchies with pre-built tree nodes and resolved titles.
 */
export class VisualisedHierarchyResult {
    readonly references: VisualisedReferenceHierarchy[]

    constructor(references: VisualisedReferenceHierarchy[]) {
        this.references = references
    }
}

/**
 * Named hierarchies for a single reference (or self hierarchy when referenceSchema is undefined).
 */
export class VisualisedReferenceHierarchy {
    /** Undefined for self hierarchy (the queried entity's own hierarchy). */
    readonly referenceSchema: ReferenceSchema | undefined
    readonly namedHierarchies: VisualisedNamedHierarchyEntry[]

    constructor(
        referenceSchema: ReferenceSchema | undefined,
        namedHierarchies: VisualisedNamedHierarchyEntry[]
    ) {
        this.referenceSchema = referenceSchema
        this.namedHierarchies = namedHierarchies
    }
}

/**
 * A single named hierarchy within a reference, pairing the hierarchy name with its resolved tree.
 */
export class VisualisedNamedHierarchyEntry {
    readonly name: string
    readonly hierarchy: VisualisedNamedHierarchy

    constructor(name: string, hierarchy: VisualisedNamedHierarchy) {
        this.name = name
        this.hierarchy = hierarchy
    }
}
