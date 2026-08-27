import { test, expect, describe } from 'vitest'
import { Map as ImmutableMap } from 'immutable'
import {
    GraphQLHierarchyResultParser
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLHierarchyResultParser'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type {
    VisualisedHierarchyResult
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyResult'
import type {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'

/**
 * The GraphQL hierarchy comes in flat and level-ordered, and the parser rebuilds the tree from it with a
 * stack. Nothing covered that algorithm, and it used to depend on mutating a `children` array captured by
 * an already-constructed node — the nodes now hold an immutable list and are built once their children are
 * complete, which is only equivalent if the traversal below keeps producing the same tree.
 *
 * A `self` hierarchy is used throughout, because that branch resolves titles from the passed entity schema
 * and never touches the server.
 */

/** Minimal entity schema: the `self` branch only reads representative attribute names off it. */
const entitySchema: EntitySchema = {
    name: 'Product',
    attributes: ImmutableMap()
} as unknown as EntitySchema

const unusableClient: EvitaClient = {} as unknown as EvitaClient

function node(level: number, primaryKey: number, extra: Record<string, unknown> = {}): Record<string, unknown> {
    return { level, entity: { primaryKey }, ...extra }
}

function hierarchyResult(nodes: Record<string, unknown>[]): unknown {
    return { extraResults: { hierarchy: { self: { megaMenu: nodes } } } }
}

async function parseSelfHierarchy(nodes: Record<string, unknown>[]): Promise<VisualisedHierarchyTreeNode[]> {
    const parser: GraphQLHierarchyResultParser = new GraphQLHierarchyResultParser(unusableClient)
    const result: VisualisedHierarchyResult = await parser.parse(hierarchyResult(nodes), entitySchema, 'evita')
    const hierarchy = result.references[0]!.namedHierarchies[0]!.hierarchy
    return hierarchy.trees.toArray()
}

function primaryKeysOf(nodes: VisualisedHierarchyTreeNode[]): unknown[] {
    return nodes.map(it => it.children.isEmpty()
        ? it.primaryKey
        : [it.primaryKey, primaryKeysOf(it.children.toArray())])
}

describe('GraphQL hierarchy result parser', () => {
    test('Should nest deeper levels under the preceding node', async () => {
        const trees = await parseSelfHierarchy([
            node(1, 1),
            node(2, 11),
            node(2, 12),
            node(1, 2)
        ])

        expect(primaryKeysOf(trees)).toEqual([[1, [11, 12]], 2])
    })

    test('Should climb back up several levels at once', async () => {
        const trees = await parseSelfHierarchy([
            node(1, 1),
            node(2, 11),
            node(3, 111),
            node(1, 2)
        ])

        expect(primaryKeysOf(trees)).toEqual([[1, [[11, [111]]]], 2])
    })

    test('Should keep every node of a single chain', async () => {
        const trees = await parseSelfHierarchy([
            node(1, 1),
            node(2, 11),
            node(3, 111)
        ])

        expect(primaryKeysOf(trees)).toEqual([[1, [[11, [111]]]]])
        expect(trees[0]!.isLeaf()).toBe(false)
        expect(trees[0]!.children.first()!.children.first()!.isLeaf()).toBe(true)
    })

    test('Should report the requested node as the fully built one', async () => {
        const parser: GraphQLHierarchyResultParser = new GraphQLHierarchyResultParser(unusableClient)
        const result: VisualisedHierarchyResult = await parser.parse(
            hierarchyResult([node(1, 1), node(2, 11, { requested: true }), node(2, 12)]),
            entitySchema,
            'evita'
        )

        const hierarchy = result.references[0]!.namedHierarchies[0]!.hierarchy
        expect(hierarchy.requestedNode?.primaryKey).toBe(11)
        expect(hierarchy.requestedNode).toBe(hierarchy.trees.first()!.children.first())
        expect(hierarchy.count).toBe(3)
    })

    test('Should carry node counts and treat a missing level as the first one', async () => {
        const trees = await parseSelfHierarchy([
            { entity: { primaryKey: 1 }, childrenCount: 2, queriedEntityCount: 7 }
        ])

        expect(trees[0]!.childrenCount).toBe(2)
        expect(trees[0]!.queriedEntityCount).toBe(7)
        expect(trees[0]!.isLeaf()).toBe(true)
    })

    test('Should return no references when the result carries no hierarchy', async () => {
        const parser: GraphQLHierarchyResultParser = new GraphQLHierarchyResultParser(unusableClient)

        const result: VisualisedHierarchyResult = await parser.parse({ extraResults: {} }, entitySchema, 'evita')

        expect(result.references).toEqual([])
    })
})
