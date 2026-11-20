import { List } from 'immutable'
import type { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { VisualisedFormulaPlan } from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlan'
import {
    VisualisedFormulaPlanNode
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlanNode'

/**
 * Minimal number of consecutive similar childless siblings collapsed into one group node.
 */
export const minCollapsedRunLength: number = 3

/**
 * Prepares a formula plan for the Plan tab. Runs of at least {@link minCollapsedRunLength} consecutive childless
 * siblings with an equal description and no `refTo` (typically hundreds of `1 primary keys` leaves under one `OR`)
 * are collapsed into one group node of similar formulas carrying the member count and the summed numbers;
 * back-references keep pointing at the right node, the group included.
 *
 * With `hideNotComputed`, formulas that neither ran nor were priced are dropped with their subtree before the runs are
 * detected (the root and back-references are always kept), so a group consists of computed members only.
 */
export function visualiseFormulaPlan(stepId: string,
                                     executed: boolean,
                                     plan: FormulaPlan,
                                     hideNotComputed: boolean = false): VisualisedFormulaPlan {
    const isVisible = (node: FormulaPlan): boolean =>
        !hideNotComputed || node.refTo != undefined || node.actualCost != undefined || node.resultCount != undefined
    const runs: FormulaPlan[][] = []
    collectRuns(plan, isVisible, runs)
    const groupKeyOfMember: Map<number, string> = new Map()
    runs.forEach(run => {
        const key: string = groupKey(run)
        run.forEach(member => groupKeyOfMember.set(member.id, key))
    })

    let formulaCount: number = 0
    let sharedCount: number = 0
    let hiddenCount: number = 0
    const count = (node: FormulaPlan, hidden: boolean): void => {
        formulaCount++
        if (node.refTo != undefined) {
            sharedCount++
        }
        if (hidden) {
            hiddenCount++
        }
        node.children.forEach(child => count(child, hidden || !isVisible(child)))
    }
    count(plan, false)

    return new VisualisedFormulaPlan(
        stepId,
        executed,
        visualiseNode(plan, isVisible, groupKeyOfMember),
        formulaCount,
        sharedCount,
        hiddenCount
    )
}

/**
 * Turns the members of a group of similar formulas into standalone leaf nodes, in plan order, for the tab that lists
 * them one by one.
 */
export function visualiseFormulaGroupMembers(group: VisualisedFormulaPlanNode): List<VisualisedFormulaPlanNode> {
    return group.members.map(member => visualiseNode(member, () => true, new Map()))
}

function isCollapsible(node: FormulaPlan): boolean {
    return node.children.isEmpty() && node.refTo == undefined
}

function groupKey(run: FormulaPlan[]): string {
    return `#${run[0]?.id}×${run.length}`
}

/**
 * Splits the children of every node into runs of collapsible siblings with equal descriptions.
 */
function forEachRun(node: FormulaPlan,
                    isVisible: (node: FormulaPlan) => boolean,
                    onRun: (run: FormulaPlan[]) => void,
                    onSingle: (child: FormulaPlan) => void): void {
    let run: FormulaPlan[] = []
    const flush = (): void => {
        if (run.length >= minCollapsedRunLength) {
            onRun(run)
        } else {
            run.forEach(onSingle)
        }
        run = []
    }
    node.children.filter(isVisible).forEach(child => {
        if (isCollapsible(child) && run.length > 0 && run[0]?.description === child.description) {
            run.push(child)
            return
        }
        flush()
        if (isCollapsible(child)) {
            run.push(child)
        } else {
            onSingle(child)
        }
    })
    flush()
}

function collectRuns(node: FormulaPlan, isVisible: (node: FormulaPlan) => boolean, runs: FormulaPlan[][]): void {
    forEachRun(node, isVisible, run => runs.push(run), child => collectRuns(child, isVisible, runs))
}

function visualiseNode(node: FormulaPlan,
                       isVisible: (node: FormulaPlan) => boolean,
                       groupKeyOfMember: ReadonlyMap<number, string>): VisualisedFormulaPlanNode {
    const children: VisualisedFormulaPlanNode[] = []
    forEachRun(
        node,
        isVisible,
        run => children.push(visualiseGroup(run)),
        child => children.push(visualiseNode(child, isVisible, groupKeyOfMember))
    )
    return new VisualisedFormulaPlanNode(
        `#${node.id}`,
        node.id,
        node.refTo,
        node.refTo == undefined ? undefined : (groupKeyOfMember.get(node.refTo) ?? `#${node.refTo}`),
        node.hash,
        node.description,
        toNumber(node.estimatedCost),
        toNumber(node.actualCost),
        node.resultCount,
        List(),
        List(children)
    )
}

function visualiseGroup(run: FormulaPlan[]): VisualisedFormulaPlanNode {
    const first: FormulaPlan | undefined = run[0]
    return new VisualisedFormulaPlanNode(
        groupKey(run),
        first?.id ?? 0,
        undefined,
        undefined,
        undefined,
        first?.description,
        sumOf(run.map(it => toNumber(it.estimatedCost))),
        sumOf(run.map(it => toNumber(it.actualCost))),
        sumOf(run.map(it => it.resultCount)),
        List(run),
        List()
    )
}

function toNumber(value: bigint | undefined): number | undefined {
    return value == undefined ? undefined : Number(value)
}

/**
 * Sum of the values, or `undefined` unless every one of them is known.
 */
function sumOf(values: (number | undefined)[]): number | undefined {
    let sum: number = 0
    for (const value of values) {
        if (value == undefined) {
            return undefined
        }
        sum += value
    }
    return sum
}
