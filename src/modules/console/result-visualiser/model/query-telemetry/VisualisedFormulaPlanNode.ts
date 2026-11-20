import { List } from 'immutable'
import type { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { FormulaPlanNodeState } from './FormulaPlanNodeState'

/**
 * One node of a visualised formula plan: either a formula of the plan, a childless back-reference to a formula
 * reachable by another path (`refTo`), or a synthetic group standing for a run of similar childless siblings - equal
 * description, but each with its own instance, hash and numbers (`445 × 1 primary keys`).
 *
 * Costs are `number` (they only feed labels); `hash` stays `bigint`.
 */
export class VisualisedFormulaPlanNode {
    /**
     * Key of the node in the laid-out graph: `#<id>` for a formula, `#<first id>×<count>` for a group.
     */
    readonly key: string
    /**
     * Instance id of the formula (of the first member for a group).
     */
    readonly formulaId: number
    /**
     * Instance id of the formula a back-reference points to.
     */
    readonly refTo: number | undefined
    /**
     * Graph key of the node a back-reference resolves to - the group key when the target was collapsed into one.
     */
    readonly refKey: string | undefined
    readonly hash: bigint | undefined
    readonly description: string | undefined
    /**
     * Estimated cost; the sum over the members for a group.
     */
    readonly estimatedCost: number | undefined
    /**
     * Actual cost; the sum over the members for a group, `undefined` unless every member has one.
     */
    readonly actualCost: number | undefined
    /**
     * Result row count; the sum over the members for a group, `undefined` unless every member has one.
     */
    readonly resultCount: number | undefined
    /**
     * Members of a group, empty for a formula.
     */
    readonly members: List<FormulaPlan>
    readonly children: List<VisualisedFormulaPlanNode>

    constructor(key: string,
                formulaId: number,
                refTo: number | undefined,
                refKey: string | undefined,
                hash: bigint | undefined,
                description: string | undefined,
                estimatedCost: number | undefined,
                actualCost: number | undefined,
                resultCount: number | undefined,
                members: List<FormulaPlan>,
                children: List<VisualisedFormulaPlanNode>) {
        this.key = key
        this.formulaId = formulaId
        this.refTo = refTo
        this.refKey = refKey
        this.hash = hash
        this.description = description
        this.estimatedCost = estimatedCost
        this.actualCost = actualCost
        this.resultCount = resultCount
        this.members = members
        this.children = children
    }

    get isGroup(): boolean {
        return this.members.size > 0
    }

    get isReference(): boolean {
        return this.refTo != undefined
    }

    /**
     * Number of formulas the node stands for: the member count of a group, `1` otherwise.
     */
    get count(): number {
        return this.isGroup ? this.members.size : 1
    }

    get state(): FormulaPlanNodeState {
        if (this.actualCost != undefined) {
            return FormulaPlanNodeState.Computed
        }
        if (this.resultCount != undefined) {
            return FormulaPlanNodeState.RanNotPriced
        }
        return FormulaPlanNodeState.NotComputed
    }
}
