import { test, expect, describe } from 'vitest'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import {
    EvitaQLHierarchyResultParser
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLHierarchyResultParser'
import { LevelInfo } from '@/modules/database-driver/request-response/data/LevelInfo'
import { Hierarchy } from '@/modules/database-driver/request-response/data/Hierarchy'
import { ExtraResults } from '@/modules/database-driver/request-response/data/ExtraResults'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'
import { EntityReference } from '@/modules/database-driver/request-response/data/EntityReference'
import {
    EntityReferenceWithParent
} from '@/modules/database-driver/request-response/data/EntityReferenceWithParent'
import { Attributes } from '@/modules/database-driver/request-response/data/Attributes'
import { AssociatedData } from '@/modules/database-driver/request-response/data/AssociatedData'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { DataChunk } from '@/modules/database-driver/request-response/data/DataChunk'
import type {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'

/**
 * A hierarchy node carries either a full entity or a bare reference to it, and the parser has to read the
 * primary key from whichever arrived while resolving a title only from the full one. Both fields used to be
 * separate on {@link LevelInfo}; they are now a single field typed by their common ancestor, which is only
 * equivalent as long as the reads below keep resolving the same way.
 */

/** Minimal entity schema: the `self` branch only reads representative attribute names off it. */
const entitySchema: EntitySchema = {
    name: 'Category',
    attributes: ImmutableMap({
        name: { representative: true, nameVariants: ImmutableMap({ [NamingConvention.CamelCase]: 'name' }) }
    })
} as unknown as EntitySchema

const unusableClient: EvitaClient = {} as unknown as EvitaClient

function fetchedEntity(primaryKey: number, name: string, parentPrimaryKey?: number): Entity {
    return new Entity(
        'Category',
        primaryKey,
        1,
        1,
        parentPrimaryKey == undefined
            ? undefined
            : new EntityReferenceWithParent('Category', parentPrimaryKey, 1, undefined),
        new Attributes(ImmutableMap({ name }), ImmutableMap()),
        new AssociatedData(ImmutableMap(), ImmutableMap()),
        ImmutableList(),
        PriceInnerRecordHandling.None,
        ImmutableList(),
        undefined,
        ImmutableList(),
        EntityScope.Live
    )
}

function levelInfo(entity: EntityReference | undefined, children: LevelInfo[] = []): LevelInfo {
    return new LevelInfo(ImmutableList(children), false, children.length, 1, entity)
}

async function parseSelfHierarchy(levelInfos: LevelInfo[]): Promise<VisualisedHierarchyTreeNode[]> {
    const response: EvitaResponse = new EvitaResponse(
        {} as unknown as DataChunk,
        new ExtraResults(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            new Hierarchy(ImmutableMap({ megaMenu: ImmutableList(levelInfos) }))
        ),
        '{}'
    )
    const parser: EvitaQLHierarchyResultParser = new EvitaQLHierarchyResultParser(unusableClient)
    const result = await parser.parse(response, entitySchema, 'evita')
    return result.references[0]!.namedHierarchies[0]!.hierarchy.trees.toArray()
}

describe('evitaQL hierarchy result parser', () => {
    test('Should resolve a node whose entity body was fetched', async () => {
        const trees = await parseSelfHierarchy([levelInfo(fetchedEntity(1, 'Electronics'))])

        expect(trees).toHaveLength(1)
        expect(trees[0]!.primaryKey).toBe(1)
        expect(trees[0]!.title).toBe('Electronics')
    })

    test('Should resolve the primary key of a node that carries only a reference', async () => {
        const trees = await parseSelfHierarchy([levelInfo(new EntityReference('Category', 42, 1))])

        expect(trees[0]!.primaryKey).toBe(42)
        expect(trees[0]!.title).toBeUndefined()
    })

    test('Should read the parent primary key of a root node only from a fetched entity', async () => {
        const fromEntity = await parseSelfHierarchy([levelInfo(fetchedEntity(2, 'Phones', 1))])
        expect(fromEntity[0]!.parentPrimaryKey).toBe(1)

        const fromReference = await parseSelfHierarchy([levelInfo(new EntityReference('Category', 2, 1))])
        expect(fromReference[0]!.parentPrimaryKey).toBeUndefined()
    })

    test('Should keep children nested under their parent', async () => {
        const trees = await parseSelfHierarchy([
            levelInfo(fetchedEntity(1, 'Electronics'), [
                levelInfo(fetchedEntity(11, 'Phones')),
                levelInfo(new EntityReference('Category', 12, 1))
            ])
        ])

        expect(trees[0]!.children.map(it => it.primaryKey).toArray()).toEqual([11, 12])
    })

    test('Should return no references when the response has no extra results', async () => {
        const parser: EvitaQLHierarchyResultParser = new EvitaQLHierarchyResultParser(unusableClient)

        const result = await parser.parse(
            new EvitaResponse({} as unknown as DataChunk, undefined, '{}'),
            entitySchema,
            'evita'
        )

        expect(result.references).toHaveLength(0)
    })
})
