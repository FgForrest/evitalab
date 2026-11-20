/**
 * Outcome of one index-selection candidate (a `PLANNING_FILTER_ALTERNATIVE` step) as the visualiser reads it.
 *
 * The winner is recognised by the structural `hash` of its candidate plan root: it equals the root hash of the
 * executed plan (`OVERALL.plan`), or - for an alternative of a nested `PLANNING_FILTER` - one of the executed plan's
 * node hashes. The `Selected index: …` argument of the parent is shown verbatim and never parsed.
 */
export class TelemetryAlternativeVerdict {
    /**
     * `false` when the engine refused to plan the alternative separately (`not eligible … due to: HIGH_CARDINALITY`).
     */
    readonly eligible: boolean
    /**
     * Reason parsed from the `(not eligible for separate query plan due to: …)` suffix of the argument, if any.
     */
    readonly ineligibleReason: string | undefined
    /**
     * The alternative's plan is the one that was executed.
     */
    readonly winner: boolean
    /**
     * The alternative carries a plan, but the hash of it or of the executed plan is unknown (not selected in
     * GraphQL), so whether it won cannot be decided.
     */
    readonly hashUnknown: boolean
    /**
     * Another alternative of the same `PLANNING_FILTER` is the winner; the card is dimmed.
     */
    readonly outranked: boolean
    /**
     * The profile was taken with `PLAN` and the alternative of a nested `PLANNING_FILTER` is eligible but carries no
     * plan - the engine does not record plans of nested entity-having queries. Always `false` for a profile without
     * `PLAN` and for the top-level selection.
     */
    readonly planNotRecorded: boolean

    constructor(eligible: boolean,
                ineligibleReason: string | undefined,
                winner: boolean,
                hashUnknown: boolean,
                outranked: boolean,
                planNotRecorded: boolean) {
        this.eligible = eligible
        this.ineligibleReason = ineligibleReason
        this.winner = winner
        this.hashUnknown = hashUnknown
        this.outranked = outranked
        this.planNotRecorded = planNotRecorded
    }
}
