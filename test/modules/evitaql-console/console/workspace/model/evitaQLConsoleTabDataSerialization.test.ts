import { describe, expect, test, vi } from 'vitest'

// the tab definition eagerly imports its Vue component, which cannot be loaded in a plain Node test environment;
// the factory only needs a constructor that keeps the restored data reachable
vi.mock('@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition', () => ({
    EvitaQLConsoleTabDefinition: class {
        readonly initialData: unknown
        constructor(_title: string, _params: unknown, initialData: unknown) {
            this.initialData = initialData
        }
        static icon(): string {
            return 'mdi-variable'
        }
    }
}))

import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import type {
    EvitaQLConsoleTabDataDto
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDataDto'
import {
    EvitaQLConsoleTabFactory
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import type { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'

// the factory only needs to hand out a connection while restoring the params half of the tab
const connectionService = {
    getConnection: () => new Connection('test', 'test', 'http://localhost:5555')
} as unknown as ConnectionService
const factory = new EvitaQLConsoleTabFactory(connectionService)

const paramsDto = {
    connectionId: 'test',
    catalogName: 'evita'
} as unknown as TabParamsDto

function restore(dataDto?: EvitaQLConsoleTabDataDto): EvitaQLConsoleTabData {
    return factory.restoreFromJson(paramsDto, dataDto).initialData
}

describe('EvitaQLConsoleTabData serialization', () => {

    test('the query survives the serialization round trip', () => {
        const data = new EvitaQLConsoleTabData('query(collection("Product"))')

        expect(restore(data.toSerializable()).query).toBe('query(collection("Product"))')
    })

    test('tab data stored while the console still had a variables editor restores its query', () => {
        // already issued share links and tabs persisted by an older evitaLab carry a variables document;
        // it is ignored rather than rejected
        const legacyDto = {
            query: 'query(collection("Product"))',
            variables: '{\n  "pk": 1\n}'
        } as EvitaQLConsoleTabDataDto

        const restored: EvitaQLConsoleTabData = restore(legacyDto)

        expect(restored.query).toBe('query(collection("Product"))')
        expect(restored.toSerializable()).toEqual({ query: 'query(collection("Product"))' })
    })

    test('tab data restores from an empty and a missing DTO', () => {
        expect(restore({} as EvitaQLConsoleTabDataDto).query).toBeUndefined()
        expect(restore(undefined).query).toBeUndefined()
    })
})
