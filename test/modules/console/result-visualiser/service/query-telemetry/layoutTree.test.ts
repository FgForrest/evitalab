import { describe, expect, test } from 'vitest'
import { layoutGrid, layoutTree, type TreeLayout } from '@/modules/console/result-visualiser/service/query-telemetry/layoutTree'
import { visualiseFormulaPlan } from '@/modules/console/result-visualiser/service/query-telemetry/visualiseFormulaPlan'
import {
    visualiseQueryTelemetry
} from '@/modules/console/result-visualiser/service/query-telemetry/visualiseQueryTelemetry'
import type {
    VisualisedFormulaPlanNode
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlanNode'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import type { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { formula, parsedQ4, parsedR3 } from './fixtures'

describe('Tree layout', () => {
    test('Should stack leaves and centre parents top-down', () => {
        const plan: FormulaPlan = formula(0, 'root', [formula(1, 'a', [formula(3, 'c')]), formula(2, 'b')])
        const layout: TreeLayout<VisualisedFormulaPlanNode> = layoutTree(
            visualiseFormulaPlan('x', true, plan).root,
            { orientation: 'TB', w: 100, h: 50, gapMain: 20, gapCross: 10, children: node => node.children }
        )
        const byKey = new Map(layout.nodes.map(it => [it.node.key, it]))

        expect(layout.nodes.map(it => it.node.key)).toEqual(['#0', '#1', '#3', '#2'])
        expect(byKey.get('#3')).toMatchObject({ x: 0, y: 140, depth: 2 })
        expect(byKey.get('#1')).toMatchObject({ x: 0, y: 70 })
        expect(byKey.get('#2')).toMatchObject({ x: 110, y: 70 })
        expect(byKey.get('#0')).toMatchObject({ x: 55, y: 0 })
        expect(layout.width).toBe(210)
        expect(layout.height).toBe(190)
        expect(layout.edges.every(it => !it.ref)).toBe(true)
        expect(layout.edges).toHaveLength(3)
    })

    test('Should resolve back-references of the r3 plan to edges to the canonical node', () => {
        const plan: FormulaPlan | undefined = parsedR3.telemetry.plan
        expect(plan).toBeDefined()
        if (plan == undefined) {
            return
        }
        const root: VisualisedFormulaPlanNode = visualiseFormulaPlan('OVERALL', true, plan).root
        const layout: TreeLayout<VisualisedFormulaPlanNode> = layoutTree(root, {
            orientation: 'LR', w: 272, h: 64, gapMain: 60, gapCross: 14,
            children: node => node.children,
            nodeId: node => node.key,
            isRef: node => node.isReference,
            refTarget: node => node.refKey
        })
        const refEdges = layout.edges.filter(it => it.ref)

        expect(layout.nodes.every(it => !it.node.isReference)).toBe(true)
        expect(refEdges).toHaveLength(3)
        refEdges.forEach(edge => {
            expect(edge.to.node.isReference).toBe(false)
            expect(edge.to.node.children.size).toBeGreaterThan(0)
        })
        expect(layout.edges.filter(it => !it.ref)).toHaveLength(layout.nodes.length - 1)
        // left-to-right: depth is the column
        layout.nodes.forEach(it => expect(it.x).toBe(it.depth * 332))
        expect(new Set(layout.nodes.map(it => `${it.x}:${it.y}`)).size).toBe(layout.nodes.length)
    })

    test('Should lay out the q4 step tree without overlaps', () => {
        const root: VisualisedTelemetryStep = visualiseQueryTelemetry(parsedQ4).root
        const layout: TreeLayout<VisualisedTelemetryStep> = layoutTree(root, {
            orientation: 'TB', w: 256, h: 88, gapMain: 34, gapCross: 12, children: node => node.children
        })
        const leaves = layout.nodes.filter(it => it.node.children.isEmpty())

        expect(layout.nodes).toHaveLength(22)
        expect(leaves.map(it => it.x)).toEqual(leaves.map((_, index) => index * 268))
        expect(layout.width).toBe((leaves.length - 1) * 268 + 256)
        expect(layout.height).toBe(6 * 122 + 88)
        layout.edges.forEach(edge => expect(edge.to.y - edge.from.y).toBe(122))
    })
})

describe('Grid layout', () => {
    test('Should place nodes row by row in a roughly square grid without edges', () => {
        const layout: TreeLayout<number> = layoutGrid([1, 2, 3, 4, 5], { w: 100, h: 100, gap: 10 })

        expect(layout.edges).toHaveLength(0)
        expect(layout.nodes.map(it => [it.x, it.y])).toEqual([[0, 0], [110, 0], [220, 0], [0, 110], [110, 110]])
        expect(layout.width).toBe(320)
        expect(layout.height).toBe(210)
    })

    test('Should lay out an empty list as an empty grid', () => {
        const layout: TreeLayout<number> = layoutGrid([], { w: 100, h: 100, gap: 10 })

        expect(layout.nodes).toHaveLength(0)
        expect(layout.width).toBe(0)
        expect(layout.height).toBe(0)
    })
})
