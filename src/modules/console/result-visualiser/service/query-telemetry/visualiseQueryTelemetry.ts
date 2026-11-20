import { List } from 'immutable'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import type { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'
import type { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { ParsedQueryTelemetry } from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import { VisualisedQueryTelemetry } from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import { VisualisedTelemetryStep } from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import {
    TelemetryAlternativeVerdict
} from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryAlternativeVerdict'
import { TelemetryPhaseShare } from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryPhaseShare'
import {
    TelemetryPhaseGroup,
    telemetryPhaseGroupOf
} from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryPhaseGroup'

const rootId: string = QueryPhase.Overall
const notEligiblePattern: RegExp = /not eligible/
const ineligibleReasonPattern: RegExp = /not eligible[^)]*due to: ([A-Z_]+)/

/**
 * What the executed plan says about the winner of every index selection, and whether the profile carries plans at all.
 */
type ExecutedPlanHashes = {
    /**
     * Root hash of `OVERALL.plan`, `undefined` when there is no plan or its hash was not selected.
     */
    readonly root: bigint | undefined
    /**
     * Hashes of every node of `OVERALL.plan`.
     */
    readonly all: ReadonlySet<bigint>
    /**
     * The profile was taken with `PLAN`: the root or any step carries a formula plan.
     */
    readonly profiledWithPlan: boolean
}

/**
 * Turns parsed telemetry into the {@link VisualisedQueryTelemetry} view model: stable ids, shares, the verdict of every
 * index-selection candidate, plan targets and the phase share bar.
 */
export function visualiseQueryTelemetry(parsed: ParsedQueryTelemetry): VisualisedQueryTelemetry {
    const telemetry: QueryTelemetry = parsed.telemetry
    const total: number = Number(telemetry.spentTime)
    const hashes: ExecutedPlanHashes = collectExecutedPlanHashes(telemetry)

    const root: VisualisedTelemetryStep = visualiseStep(
        telemetry, rootId, undefined, 0, 0, total, total, undefined, hashes, false, false
    )
    const steps: VisualisedTelemetryStep[] = []
    const collect = (step: VisualisedTelemetryStep): void => {
        steps.push(step)
        step.children.forEach(collect)
    }
    collect(root)

    return new VisualisedQueryTelemetry(
        root,
        List(steps),
        total,
        computePhaseShares(root, total),
        parsed.missingSelections,
        telemetry.startedAt
    )
}

function collectExecutedPlanHashes(telemetry: QueryTelemetry): ExecutedPlanHashes {
    const plan: FormulaPlan | undefined = telemetry.plan
    const all: Set<bigint> = new Set()
    const collect = (node: FormulaPlan): void => {
        if (node.hash != undefined) {
            all.add(node.hash)
        }
        node.children.forEach(collect)
    }
    if (plan != undefined) {
        collect(plan)
    }
    return { root: plan?.hash, all, profiledWithPlan: anyStepHasPlan(telemetry) }
}

function anyStepHasPlan(step: QueryTelemetry): boolean {
    return step.plan != undefined || step.steps.some(anyStepHasPlan)
}

/**
 * Whether an alternative's plan is the executed one. For the top-level selection only the root hashes may match (a
 * loser's formula can equal a sub-formula of the executed plan); for a nested one the alternative's root is somewhere
 * inside the executed plan.
 */
function isWinner(plan: FormulaPlan | undefined, hashes: ExecutedPlanHashes, topLevelSelection: boolean): boolean {
    if (plan?.hash == undefined || hashes.root == undefined) {
        return false
    }
    return plan.hash === hashes.root || (!topLevelSelection && hashes.all.has(plan.hash))
}

function visualiseStep(source: QueryTelemetry,
                       id: string,
                       parentId: string | undefined,
                       depth: number,
                       ordinal: number,
                       parentSpent: number,
                       total: number,
                       parent: QueryTelemetry | undefined,
                       hashes: ExecutedPlanHashes,
                       siblingWon: boolean,
                       topLevelSelection: boolean): VisualisedTelemetryStep {
    const spent: number = Number(source.spentTime)

    let alternative: TelemetryAlternativeVerdict | undefined = undefined
    let planStepId: string | undefined = source.plan != undefined ? id : undefined
    if (source.operation === QueryPhase.PlanningFilterAlternative) {
        const argument: string = source.arguments.first() ?? ''
        const eligible: boolean = !notEligiblePattern.test(argument)
        const winner: boolean = isWinner(source.plan, hashes, topLevelSelection)
        alternative = new TelemetryAlternativeVerdict(
            eligible,
            argument.match(ineligibleReasonPattern)?.[1],
            winner,
            source.plan != undefined && (source.plan.hash == undefined || hashes.root == undefined),
            siblingWon && !winner,
            // only a profile taken with PLAN can miss a plan, and evitaDB omits it for nested selections only
            hashes.profiledWithPlan && eligible && !topLevelSelection && source.plan == undefined
        )
        if (winner) {
            // the winner's candidate plan is a pre-execution rendering of the very formula that ran
            planStepId = rootId
        }
    }

    // the PLANNING_FILTER of the main query: its PLANNING parent is a direct child of the root
    const isTopLevelSelection: boolean = source.operation === QueryPhase.PlanningFilter &&
        depth === 2 &&
        parent?.operation === QueryPhase.Planning
    const anyChildWon: boolean = source.steps.some(child =>
        child.operation === QueryPhase.PlanningFilterAlternative && isWinner(child.plan, hashes, isTopLevelSelection)
    )
    const children: List<VisualisedTelemetryStep> = source.steps.map((child, index) => visualiseStep(
        child,
        `${id}/${child.operation}[${index}]`,
        id,
        depth + 1,
        index,
        spent,
        total,
        source,
        hashes,
        anyChildWon,
        isTopLevelSelection
    ))

    return new VisualisedTelemetryStep(
        id,
        parentId,
        depth,
        ordinal,
        source.operation,
        Number(source.start),
        spent,
        source.selfTime == undefined ? undefined : Number(source.selfTime),
        total === 0 ? 0 : spent / total,
        parent == undefined || parentSpent === 0 ? 1 : spent / parentSpent,
        source.arguments,
        source.metrics,
        source.plan,
        alternative,
        planStepId,
        children
    )
}

/**
 * Splits the total into planning, execution, fetching and the root's own time from specific nodes rather than by
 * summing name prefixes: `FETCHING` is a child of `EXECUTION` and planning phases also run nested inside `EXECUTION`
 * (hierarchy statistics), so planning is what the root's planning children took, fetching what the fetching steps
 * directly below the root or below its execution children took, execution the rest of the root's execution children,
 * and the root keeps whatever none of them covers.
 */
function computePhaseShares(root: VisualisedTelemetryStep, total: number): List<TelemetryPhaseShare> {
    let planning: number = 0
    let execution: number = 0
    let fetching: number = 0
    root.children.forEach(child => {
        switch (child.group) {
            case TelemetryPhaseGroup.Planning:
                planning += child.spent
                break
            case TelemetryPhaseGroup.Fetching:
                fetching += child.spent
                break
            default: {
                const nestedFetching: number = child.children
                    .filter(it => telemetryPhaseGroupOf(it.operation) === TelemetryPhaseGroup.Fetching)
                    .reduce((sum, it) => sum + it.spent, 0)
                fetching += nestedFetching
                execution += child.spent - nestedFetching
            }
        }
    })
    const rootSelf: number = Math.max(0, total - planning - execution - fetching)
    const shareOf = (nanos: number): number => total === 0 ? 0 : nanos / total
    return List([
        new TelemetryPhaseShare(TelemetryPhaseGroup.Planning, planning, shareOf(planning)),
        new TelemetryPhaseShare(TelemetryPhaseGroup.Execution, execution, shareOf(execution)),
        new TelemetryPhaseShare(TelemetryPhaseGroup.Fetching, fetching, shareOf(fetching)),
        new TelemetryPhaseShare(TelemetryPhaseGroup.Root, rootSelf, shareOf(rootSelf))
    ])
}
