/**
 * Whether a formula of a plan was evaluated, derived from which of its numbers are present. Absence is an honest
 * state here, never "missing data".
 */
export enum FormulaPlanNodeState {
    /**
     * `actualCost` is present - the formula ran and was priced.
     */
    Computed = 'computed',
    /**
     * Only `resultCount` is present - the formula ran on a branch the cost pass skipped.
     */
    RanNotPriced = 'ranNotPriced',
    /**
     * Neither is present - a candidate plan, or a short-circuited / prefetched branch of the executed plan.
     */
    NotComputed = 'notComputed'
}
