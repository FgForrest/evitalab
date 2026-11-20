import type { VisualisedFormulaPlanNode } from './VisualisedFormulaPlanNode'

/**
 * A formula plan prepared for the Plan tab: the grouped node tree plus the counts of the caption. Built by
 * `visualiseFormulaPlan`.
 */
export class VisualisedFormulaPlan {
    /**
     * Id of the telemetry step the plan belongs to.
     */
    readonly stepId: string
    /**
     * `true` for the executed plan of `OVERALL`, `false` for a candidate plan of an alternative.
     */
    readonly executed: boolean
    readonly root: VisualisedFormulaPlanNode
    /**
     * Number of formula nodes in the plan as sent, back-references included and before collapsing.
     */
    readonly formulaCount: number
    /**
     * Number of back-references (`refTo`) - formulas reachable by more than one path, computed once.
     */
    readonly sharedCount: number
    /**
     * Number of formula nodes left out because they were not computed (only when not computed formulas are hidden).
     */
    readonly hiddenCount: number

    constructor(stepId: string,
                executed: boolean,
                root: VisualisedFormulaPlanNode,
                formulaCount: number,
                sharedCount: number,
                hiddenCount: number) {
        this.stepId = stepId
        this.executed = executed
        this.root = root
        this.formulaCount = formulaCount
        this.sharedCount = sharedCount
        this.hiddenCount = hiddenCount
    }
}
