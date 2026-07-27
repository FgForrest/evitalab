import { describe, test, expect } from 'vitest'
import { EvitaQLQueryExecutor } from '../../../../../src/modules/entity-viewer/viewer/service/EvitaQLQueryExecutor'
import type { ReferenceClassification } from '../../../../../src/modules/entity-viewer/viewer/service/QueryExecutor'
import type { WritableEntityProperty } from '../../../../../src/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityReferences } from '../../../../../src/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import { EntityReferenceAttributes } from '../../../../../src/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes'
import { EntityReferenceValue } from '../../../../../src/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { ReferenceSchema } from '../../../../../src/modules/database-driver/request-response/schema/ReferenceSchema'

// backfillEmptyReferenceContainers is pure; the evitaClient is never touched by it
const executor = new EvitaQLQueryExecutor(undefined as never)

function backfill(flattened: WritableEntityProperty[]): void {
    // the method only reads referenceName and selectedColumnAttributeNames from the classification
    const classification = {
        referenceSchema: undefined as unknown as ReferenceSchema,
        selectedColumnAttributeNames: new Set<string>(['note']),
        representativeAttributeNames: new Set<string>()
    } satisfies ReferenceClassification
    const classifications = new Map<string, ReferenceClassification>([['tags', classification]])
    ;(executor as unknown as {
        backfillEmptyReferenceContainers(
            flattenedReferences: WritableEntityProperty[],
            referenceClassifications: Map<string, ReferenceClassification>
        ): void
    }).backfillEmptyReferenceContainers(flattened, classifications)
}

function find(flattened: WritableEntityProperty[], key: EntityPropertyKey): WritableEntityProperty | undefined {
    return flattened.find(([k]) => k.toString() === key.toString())
}

describe('QueryExecutor.backfillEmptyReferenceContainers', () => {
    test('emits empty containers when the entity has no references of a selected name (evitaQL omits the keys entirely)', () => {
        const flattened: WritableEntityProperty[] = []
        backfill(flattened)

        const references = find(flattened, EntityPropertyKey.references('tags'))
        expect(references).toBeDefined()
        expect(references![1]).toBeInstanceOf(EntityReferences)
        expect((references![1] as EntityReferences).count()).toBe(0)
        expect((references![1] as EntityReferences).toPreviewString()).toBe('0 tags references')

        const column = find(flattened, EntityPropertyKey.referenceAttributes('tags', 'note'))
        expect(column).toBeDefined()
        expect(column![1]).toBeInstanceOf(EntityReferenceAttributes)
        expect((column![1] as EntityReferenceAttributes).count()).toBe(0)
    })

    test('adds the missing attribute column when the references column is already present but empty (GraphQL returns an empty array)', () => {
        const flattened: WritableEntityProperty[] = [
            [EntityPropertyKey.references('tags'), new EntityReferences('tags', [])]
        ]
        backfill(flattened)

        // the existing (empty) references column is not duplicated
        const references = flattened.filter(([k]) => k.toString() === EntityPropertyKey.references('tags').toString())
        expect(references).toHaveLength(1)

        // but the previously missing attribute column is backfilled
        const column = find(flattened, EntityPropertyKey.referenceAttributes('tags', 'note'))
        expect(column).toBeDefined()
        expect((column![1] as EntityReferenceAttributes).count()).toBe(0)
    })

    test('leaves populated references untouched so partially filled columns keep their behaviour', () => {
        const populated = new EntityReferences('tags', [new EntityReferenceValue(1, [])])
        const flattened: WritableEntityProperty[] = [
            [EntityPropertyKey.references('tags'), populated]
        ]
        backfill(flattened)

        // no empty attribute column is injected for a reference name that has references
        expect(find(flattened, EntityPropertyKey.referenceAttributes('tags', 'note'))).toBeUndefined()
        // the original references container is preserved
        expect(find(flattened, EntityPropertyKey.references('tags'))![1]).toBe(populated)
        expect(flattened).toHaveLength(1)
    })
})
