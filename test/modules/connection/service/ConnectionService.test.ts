import { test, expect, describe } from 'vitest'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { Connection } from '@/modules/connection/model/Connection'
import { ConnectionNotFoundError } from '@/modules/connection/exception/ConnectionNotFoundError'

const preconfiguredConnection = { id: 'demo', name: 'Demo', serverUrl: 'https://demo.evitadb.io' }

function createConnectionService(): ConnectionService {
    const config: EvitaLabConfig = {
        systemProperty: (name: string): string | undefined =>
            name === 'connection' ? JSON.stringify(preconfiguredConnection) : undefined
    } as unknown as EvitaLabConfig
    return ConnectionService.load(config)
}

describe('ConnectionService.getConnection', () => {
    // shared tabs built by external applications carry no connection ID, because the producer
    // cannot know the ID of the target evitaLab instance; such payloads must resolve to the single
    // connection the instance is running with
    test('returns the single connection when no ID is given', () => {
        const connection: Connection = createConnectionService().getConnection()

        expect(connection.id).toEqual('demo')
    })

    test('returns the single connection for its own ID', () => {
        expect(createConnectionService().getConnection('demo').id).toEqual('demo')
    })

    test('fails for an ID of a different connection', () => {
        expect(() => createConnectionService().getConnection('other')).toThrow(ConnectionNotFoundError)
    })
})
