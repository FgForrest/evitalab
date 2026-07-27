import { describe, test, expect } from 'vitest'
import { EntityViewerService } from '../../../../../src/modules/entity-viewer/viewer/service/EntityViewerService'
import { EntityReferenceValue } from '../../../../../src/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityReferences } from '../../../../../src/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import { EntityPropertyValue } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { NativeValue } from '../../../../../src/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'

// grouping/filtering methods are pure; the evitaClient is never touched by them
const service = new EntityViewerService(undefined as never)

function ref(primaryKey: number, representativeReferenceAttributes?: Record<string, string | number>): EntityReferenceValue {
    let map: Map<string, EntityPropertyValue> | undefined
    if (representativeReferenceAttributes != undefined) {
        map = new Map<string, EntityPropertyValue>()
        for (const [name, value] of Object.entries(representativeReferenceAttributes)) {
            map.set(name, new NativeValue(value))
        }
    }
    return new EntityReferenceValue(primaryKey, [], map, undefined)
}

describe('EntityViewerService.groupReferences', () => {
    test('groups by the unique combination of representative attribute values, ordered by key', () => {
        const references = [
            ref(1, { gallery: 'main-gallery', priority: 5 }),
            ref(2, { gallery: 'motive', priority: 1 }),
            ref(3, { gallery: 'main-gallery', priority: 5 })
        ]
        const groups = service.groupReferences(references)

        expect(groups).toHaveLength(2)
        // sorted by key string: "gallery = main-gallery ..." before "gallery = motive ..."
        expect(groups[0]!.label).toBe('gallery = main-gallery · priority = 5')
        expect(groups[0]!.items.map(it => it.primaryKey)).toEqual([1, 3])
        expect(groups[1]!.label).toBe('gallery = motive · priority = 1')
        expect(groups[1]!.items.map(it => it.primaryKey)).toEqual([2])
    })

    test('keeps server order of items within a group (incl. duplicated primary keys)', () => {
        const references = [
            ref(7, { gallery: 'g' }),
            ref(7, { gallery: 'g' }),
            ref(1, { gallery: 'g' })
        ]
        const groups = service.groupReferences(references)

        expect(groups).toHaveLength(1)
        expect(groups[0]!.items.map(it => it.primaryKey)).toEqual([7, 7, 1])
    })

    test('falls back to a single flat, unlabeled group when there are no representative attributes', () => {
        const references = [ref(1), ref(2)]
        const groups = service.groupReferences(references)

        expect(groups).toHaveLength(1)
        expect(groups[0]!.label).toBe('')
        expect(groups[0]!.items.map(it => it.primaryKey)).toEqual([1, 2])
    })

    test('returns no groups for an empty reference list', () => {
        expect(service.groupReferences([])).toEqual([])
    })
})

describe('EntityViewerService.filterReferences', () => {
    const references = [
        ref(1, { gallery: 'main-gallery', priority: 5 }),
        ref(2, { gallery: 'motive', priority: 1 }),
        ref(3, { gallery: 'main-gallery', priority: 1 })
    ]

    test('narrows by a single selected value', () => {
        const selections = new Map<string, string[]>([['gallery', ['main-gallery']]])
        expect(service.filterReferences(references, selections).map(it => it.primaryKey)).toEqual([1, 3])
    })

    test('ignores attributes with an empty selection', () => {
        const selections = new Map<string, string[]>([['gallery', []]])
        expect(service.filterReferences(references, selections).map(it => it.primaryKey)).toEqual([1, 2, 3])
    })

    test('ANDs selections across multiple attributes', () => {
        const selections = new Map<string, string[]>([
            ['gallery', ['main-gallery']],
            ['priority', ['1']]
        ])
        expect(service.filterReferences(references, selections).map(it => it.primaryKey)).toEqual([3])
    })
})

describe('EntityViewerService.collectReferenceFilterData', () => {
    test('collects distinct, sorted preview values per representative attribute', () => {
        const references = [
            ref(1, { gallery: 'motive', priority: 5 }),
            ref(2, { gallery: 'main-gallery', priority: 1 }),
            ref(3, { gallery: 'motive', priority: 1 })
        ]
        const filterData = service.collectReferenceFilterData(references)

        expect(filterData.get('gallery')).toEqual(['main-gallery', 'motive'])
        expect(filterData.get('priority')).toEqual(['1', '5'])
    })

    test('is empty when no reference carries representative attributes', () => {
        expect(service.collectReferenceFilterData([ref(1), ref(2)]).size).toBe(0)
    })
})

describe('EntityReferences.toPreviewString', () => {
    test('pluralizes the reference count', () => {
        expect(new EntityReferences('tags', [ref(1)]).toPreviewString()).toBe('1 tags reference')
        expect(new EntityReferences('tags', [ref(1), ref(2)]).toPreviewString()).toBe('2 tags references')
        expect(new EntityReferences('tags', []).toPreviewString()).toBe('0 tags references')
    })
})
