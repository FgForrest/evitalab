import { List } from 'immutable'

/**
 * One node of the formula plan a query phase was carried out with - the structural counterpart of the telemetry
 * timings. Present on the root (`OVERALL`, the executed plan) and on each eligible `PLANNING_FILTER_ALTERNATIVE`
 * step (the candidate plan) when the query asked for `queryTelemetry(PLAN)` (GraphQL: selected the `plan` field).
 *
 * The plan is a DAG transferred as a tree: a formula instance reachable by two paths is described in full once and
 * every later occurrence is a childless back-reference node with {@link refTo} set to the {@link id} of the full one.
 *
 * Node states: *computed* ({@link actualCost} and {@link resultCount} present), *not computed* (both absent - a
 * rejected candidate or a short-circuited branch) and the rare *ran, not priced* ({@link resultCount} present,
 * {@link actualCost} absent).
 */
export class FormulaPlan {
    /**
     * Identity of the formula instance, unique within the plan (pre-order, deterministic). The executed plan and
     * the winning candidate plan share the same ids, because both render the same formula instance.
     */
    readonly id: number
    /**
     * Set only on a back-reference node: the {@link id} of the node that describes this instance in full.
     */
    readonly refTo: number | undefined
    /**
     * Structural hash of the formula (signed int64). Equal hashes mean interchangeable computations; it is how the
     * winning candidate plan is recognised (its root hash equals the executed plan's root hash). Never convert it to
     * `number`. Always sent by gRPC; `undefined` only when a GraphQL selection omitted it.
     */
    readonly hash: bigint | undefined
    /**
     * Human-readable description of the formula (`AND`, `OR`, `<N> primary keys`, ...). Absent on a back-reference.
     */
    readonly description: string | undefined
    /**
     * Cost the planner estimated before running anything (unitless). Always sent by gRPC; `undefined` only when a
     * GraphQL selection omitted it.
     */
    readonly estimatedCost: bigint | undefined
    /**
     * Cost the formula really incurred; absent when it was never computed.
     */
    readonly actualCost: bigint | undefined
    /**
     * Number of records the formula produced; absent when it was never computed.
     */
    readonly resultCount: number | undefined
    /**
     * Inner formulas. Always empty on a back-reference node.
     */
    readonly children: List<FormulaPlan>

    constructor(id: number,
                refTo: number | undefined,
                hash: bigint | undefined,
                description: string | undefined,
                estimatedCost: bigint | undefined,
                actualCost: bigint | undefined,
                resultCount: number | undefined,
                children: List<FormulaPlan>) {
        this.id = id
        this.refTo = refTo
        this.hash = hash
        this.description = description
        this.estimatedCost = estimatedCost
        this.actualCost = actualCost
        this.resultCount = resultCount
        this.children = children
    }
}
