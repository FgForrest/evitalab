import { describe, expect, test } from 'vitest'
import { visualiseFormulaGroupMembers, visualiseFormulaPlan } from '@/modules/console/result-visualiser/service/query-telemetry/visualiseFormulaPlan'
import type { VisualisedFormulaPlan } from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlan'
import type {
    VisualisedFormulaPlanNode
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlanNode'
import { FormulaPlanNodeState } from '@/modules/console/result-visualiser/model/query-telemetry/FormulaPlanNodeState'
import type { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { formula, parsedR3 } from './fixtures'

function flatten(node: VisualisedFormulaPlanNode): VisualisedFormulaPlanNode[] {
    return [node, ...node.children.toArray().flatMap(flatten)]
}

describe('Formula plan view model', () => {
    test('Should collapse runs of at least three identical leaves', () => {
        const leaves: FormulaPlan[] = [1, 2, 3, 4].map(id => formula(id, '1 primary keys', [], { est: 10n, act: 2n, rows: 1 }))
        const plan: FormulaPlan = formula(0, 'OR', [
            ...leaves,
            formula(5, '2 primary keys', [], { est: 3n }),
            formula(6, '1 primary keys', [], { est: 1n }),
            formula(7, '1 primary keys', [], { est: 1n })
        ])
        const visualised: VisualisedFormulaPlan = visualiseFormulaPlan('OVERALL', true, plan)
        const [group, two, single1, single2] = visualised.root.children.toArray()

        expect(visualised.root.children.size).toBe(4)
        expect(group?.isGroup).toBe(true)
        expect(group?.count).toBe(4)
        expect(group?.key).toBe('#1×4')
        expect(group?.description).toBe('1 primary keys')
        expect(group?.estimatedCost).toBe(40)
        expect(group?.actualCost).toBe(8)
        expect(group?.resultCount).toBe(4)
        expect(group?.state).toBe(FormulaPlanNodeState.Computed)
        expect(two?.isGroup).toBe(false)
        // a run of two stays expanded
        expect(single1?.isGroup).toBe(false)
        expect(single2?.isGroup).toBe(false)
        expect(single2?.state).toBe(FormulaPlanNodeState.NotComputed)
        expect(visualised.formulaCount).toBe(8)
        expect(visualised.sharedCount).toBe(0)
    })

    test('Should not collapse back-references or nodes with children and keep partial sums unknown', () => {
        const plan: FormulaPlan = formula(0, 'AND', [
            formula(1, 'x', [], { est: 1n, act: 1n }),
            formula(2, 'x', [], { est: 1n }),
            formula(3, 'x', [], { est: 1n }),
            formula(4, undefined, [], { refTo: 2 }),
            formula(5, 'x', [formula(6, 'y')]),
            formula(7, 'x', []),
            formula(8, 'x', [])
        ])
        const visualised: VisualisedFormulaPlan = visualiseFormulaPlan('OVERALL', true, plan)
        const children: VisualisedFormulaPlanNode[] = visualised.root.children.toArray()

        expect(children.map(it => it.key)).toEqual(['#1×3', '#4', '#5', '#7', '#8'])
        expect(children[0]?.actualCost).toBeUndefined()
        expect(children[0]?.estimatedCost).toBe(3)
        // the reference to a collapsed member points at the group
        expect(children[1]?.isReference).toBe(true)
        expect(children[1]?.refKey).toBe('#1×3')
        expect(visualised.sharedCount).toBe(1)
    })

    test('Should keep the r3 executed plan with its back-references', () => {
        const plan: FormulaPlan | undefined = parsedR3.telemetry.plan
        expect(plan).toBeDefined()
        if (plan == undefined) {
            return
        }
        const visualised: VisualisedFormulaPlan = visualiseFormulaPlan('OVERALL', true, plan)
        const nodes: VisualisedFormulaPlanNode[] = flatten(visualised.root)
        const references: VisualisedFormulaPlanNode[] = nodes.filter(it => it.isReference)
        const keys: Set<string> = new Set(nodes.filter(it => !it.isReference).map(it => it.key))

        expect(visualised.executed).toBe(true)
        expect(visualised.formulaCount).toBe(77)
        expect(visualised.sharedCount).toBe(3)
        expect(references).toHaveLength(3)
        references.forEach(reference => expect(keys.has(reference.refKey ?? '')).toBe(true))
        expect(visualised.root.state).toBe(FormulaPlanNodeState.Computed)
        expect(visualised.root.hash).toBeUndefined()
    })

    test('Should derive the node state from the present numbers', () => {
        const ran: VisualisedFormulaPlan = visualiseFormulaPlan('x', true, formula(0, 'NOT', [], { rows: 5 }))
        expect(ran.root.state).toBe(FormulaPlanNodeState.RanNotPriced)
    })

    test('Should hide not computed formulas with their subtrees and group computed members only', () => {
        const plan: FormulaPlan = formula(0, 'AND', [
            formula(1, '1 primary keys', [], { est: 1n, act: 1n, rows: 1 }),
            formula(2, '1 primary keys', [], { est: 1n }),
            formula(3, '1 primary keys', [], { est: 1n, act: 1n, rows: 1 }),
            formula(4, '1 primary keys', [], { est: 1n, act: 1n, rows: 1 }),
            formula(5, 'OR', [formula(6, 'x', [], { act: 1n, rows: 1 })], { est: 1n }),
            formula(7, 'NOT', [], { rows: 3 }),
            formula(8, undefined, [], { refTo: 2 })
        ])

        const all: VisualisedFormulaPlan = visualiseFormulaPlan('OVERALL', true, plan)
        expect(all.root.children.map(it => it.key).toArray()).toEqual(['#1×4', '#5', '#7', '#8'])
        expect(all.hiddenCount).toBe(0)

        const computed: VisualisedFormulaPlan = visualiseFormulaPlan('OVERALL', true, plan, true)
        const children: VisualisedFormulaPlanNode[] = computed.root.children.toArray()
        // the not computed member breaks nothing, the rest still forms a group; ran-not-priced and references stay
        expect(children.map(it => it.key)).toEqual(['#1×3', '#7', '#8'])
        expect(children[0]?.state).toBe(FormulaPlanNodeState.Computed)
        expect(children[0]?.members.map(it => it.id).toArray()).toEqual([1, 3, 4])
        // #2, #5 and the computed #6 below the not computed #5
        expect(computed.hiddenCount).toBe(3)
        expect(computed.formulaCount).toBe(all.formulaCount)
    })

    test('Should keep the root of a plan that was not computed at all', () => {
        const plan: FormulaPlan = formula(0, 'AND', [formula(1, 'x', [], { est: 1n })], { est: 1n })
        const visualised: VisualisedFormulaPlan = visualiseFormulaPlan('x', false, plan, true)

        expect(visualised.root.key).toBe('#0')
        expect(visualised.root.children.size).toBe(0)
        expect(visualised.hiddenCount).toBe(1)
    })

    test('Should turn the members of a group into standalone formulas', () => {
        const plan: FormulaPlan = formula(0, 'OR', [
            formula(1, '1 primary keys', [], { hash: 11n, est: 10n, act: 2n, rows: 1 }),
            formula(2, '1 primary keys', [], { hash: 12n, est: 20n }),
            formula(3, '1 primary keys', [], { hash: 13n, est: 30n, act: 4n, rows: 1 })
        ])
        const group: VisualisedFormulaPlanNode | undefined = visualiseFormulaPlan('x', true, plan).root.children.first()
        expect(group?.isGroup).toBe(true)
        if (group == undefined) {
            return
        }
        const members: VisualisedFormulaPlanNode[] = visualiseFormulaGroupMembers(group).toArray()

        expect(members.map(it => it.key)).toEqual(['#1', '#2', '#3'])
        expect(members.map(it => it.hash)).toEqual([11n, 12n, 13n])
        expect(members.map(it => it.estimatedCost)).toEqual([10, 20, 30])
        expect(members.map(it => it.state)).toEqual([
            FormulaPlanNodeState.Computed,
            FormulaPlanNodeState.NotComputed,
            FormulaPlanNodeState.Computed
        ])
        expect(members.every(it => !it.isGroup)).toBe(true)
    })
})
