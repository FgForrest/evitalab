import { describe, expect, test, vi } from 'vitest'

// the tab definition eagerly imports its Vue component, which cannot be loaded in a plain Node test environment;
// the factory only needs a constructor that keeps the restored data reachable
vi.mock('@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition', () => ({
    EntityViewerTabDefinition: class {
        readonly initialData: unknown
        constructor(_title: string, _params: unknown, initialData: unknown) {
            this.initialData = initialData
        }
        static icon(): string {
            return 'mdi-table'
        }
    }
}))

import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import type {
    EntityViewerTabDataDto
} from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDataDto'
import { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import type { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { SelectableScope } from '@/modules/entity-viewer/viewer/model/SelectableScope'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'

// the factory only needs to hand out a connection while restoring the params half of the tab
const connectionService = {
    getConnection: () => new Connection('test', 'test', 'http://localhost:5555')
} as unknown as ConnectionService
const factory = new EntityViewerTabFactory(connectionService)

const paramsDto = {
    connectionId: 'test',
    catalogName: 'evita',
    entityType: 'Product'
} as unknown as TabParamsDto

function restore(dataDto: EntityViewerTabDataDto): EntityViewerTabData {
    return factory.restoreFromJson(paramsDto, dataDto).initialData
}

describe('EntityViewerTabData serialization', () => {

    test('grid sort state and order by ownership survive the serialization round trip', () => {
        const data = new EntityViewerTabData(
            QueryLanguage.EvitaQL,
            'entityPrimaryKeyInSet(1)',
            'attributeNatural(code, DESC)',
            'en',
            undefined,
            25,
            1,
            undefined,
            [{ key: 'attributes:code', order: 'desc' }, { key: 'primaryKey' }],
            true
        )

        const restored: EntityViewerTabData = restore(data.toSerializable())

        expect(restored.sortBy).toEqual([{ key: 'attributes:code', order: 'desc' }, { key: 'primaryKey' }])
        expect(restored.orderByDefinedManually).toBe(true)
        expect(restored.orderBy).toBe('attributeNatural(code, DESC)')
    })

    test('tab data stored before the sort state was introduced restores without the new fields', () => {
        // already issued share links and tabs persisted by an older evitaLab simply lack the fields
        const legacyDto = {
            queryLanguage: QueryLanguage.EvitaQL,
            filterBy: 'entityPrimaryKeyInSet(1)',
            orderBy: 'attributeNatural(code, DESC)',
            pageSize: 25,
            pageNumber: 1
        } as EntityViewerTabDataDto

        const restored: EntityViewerTabData = restore(legacyDto)

        expect(restored.sortBy).toBeUndefined()
        expect(restored.orderByDefinedManually).toBeUndefined()
        expect(restored.orderBy).toBe('attributeNatural(code, DESC)')
    })

    test('scope selection survives the serialization round trip under the new wire key', () => {
        const data = new EntityViewerTabData(
            QueryLanguage.EvitaQL,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            [new SelectableScope(EntityScope.Live, false), new SelectableScope(EntityScope.Archive, true)]
        )

        const dto: EntityViewerTabDataDto = data.toSerializable()
        const restored: EntityViewerTabData = restore(dto)

        expect(dto.selectedScopes).toEqual([
            { scope: EntityScope.Live, selected: false },
            { scope: EntityScope.Archive, selected: true }
        ])
        expect(dto.selectedLayers).toBeUndefined()
        expect(restored.selectedScopes).toEqual([
            new SelectableScope(EntityScope.Live, false),
            new SelectableScope(EntityScope.Archive, true)
        ])
        expect(restored.selectedScopes![0]).toBeInstanceOf(SelectableScope)
    })

    test('scope selection stored under the legacy key and field name restores', () => {
        // tabs persisted and share links issued before the scope rename carry `selectedLayers` with `value`
        const legacyDto = {
            queryLanguage: QueryLanguage.EvitaQL,
            selectedLayers: [
                { scope: EntityScope.Live, value: true },
                { scope: EntityScope.Archive, value: true }
            ]
        } as EntityViewerTabDataDto

        const restored: EntityViewerTabData = restore(legacyDto)

        expect(restored.selectedScopes).toEqual([
            new SelectableScope(EntityScope.Live, true),
            new SelectableScope(EntityScope.Archive, true)
        ])
    })

    test('selected properties survive the serialization round trip under the new wire key', () => {
        const data = new EntityViewerTabData(
            QueryLanguage.EvitaQL,
            undefined,
            undefined,
            undefined,
            [EntityPropertyKey.attributes('code'), EntityPropertyKey.prices()]
        )

        const dto: EntityViewerTabDataDto = data.toSerializable()
        const restored: EntityViewerTabData = restore(dto)

        expect(dto.selectedProperties).toEqual(['attributes:code', 'prices'])
        expect(dto.displayedProperties).toBeUndefined()
        expect(restored.selectedProperties?.map(it => it.toString())).toEqual(['attributes:code', 'prices'])
    })

    test('selected properties stored under the legacy key restore', () => {
        // tabs persisted and share links issued before the rename carry `displayedProperties`
        const legacyDto = {
            queryLanguage: QueryLanguage.EvitaQL,
            displayedProperties: ['primaryKey', 'attributes:code']
        } as EntityViewerTabDataDto

        const restored: EntityViewerTabData = restore(legacyDto)

        expect(restored.selectedProperties?.map(it => it.toString())).toEqual(['primaryKey', 'attributes:code'])
    })
})
