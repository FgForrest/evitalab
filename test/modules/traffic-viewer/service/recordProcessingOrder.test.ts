import { describe, expect, test, vi } from 'vitest'

// the visualisers pull in the workspace service and the tab definitions, which eagerly import Vue
// components and the keyboard shortcut library; none of that is reachable in a plain Node test
// environment and none of it is used while records are processed
vi.mock('@/modules/workspace/service/WorkspaceService', () => ({ WorkspaceService: class {} }))
vi.mock('@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory', () => ({ EvitaQLConsoleTabFactory: class {} }))
vi.mock('@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory', () => ({ TrafficRecordHistoryViewerTabFactory: class {} }))

import {
    TrafficRecordHistoryVisualisationProcessor
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryVisualisationProcessor'
import { SessionStartContainerVisualiser } from '@/modules/traffic-viewer/service/SessionStartContainerVisualiser'
import { SessionCloseContainerVisualiser } from '@/modules/traffic-viewer/service/SessionCloseContainerVisualiser'
import { QueryContainerVisualiser } from '@/modules/traffic-viewer/service/QueryContainerVisualiser'
import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import { UserTrafficRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import { TrafficRecordType } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordType'
import {
    SessionStartContainer
} from '@/modules/database-driver/request-response/traffic-recording/SessionStartContainer'
import {
    SessionCloseContainer
} from '@/modules/database-driver/request-response/traffic-recording/SessionCloseContainer'
import { QueryContainer } from '@/modules/database-driver/request-response/traffic-recording/QueryContainer'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { List as ImmutableList } from 'immutable'
import { Duration } from 'luxon'
import type { App } from 'vue'
import LuxonExtensions from '@/vue-plugins/luxonExtensions'

// the visualisers render durations through the luxon extensions installed by the app bootstrap
LuxonExtensions.install!(undefined as unknown as App, {})

const catalogName: string = 'testCatalog'
const created: OffsetDateTime = OffsetDateTime.ofInstant(0n, '+00:00')
const noDuration: Duration = Duration.fromMillis(0)

/**
 * The visualisers only capture these in closures of the actions they construct, they never call them
 * while processing records.
 */
const unusedService: never = new Proxy({}, {
    get(): never {
        throw new Error('Unexpected service usage')
    }
}) as never

/**
 * @param additionalRecords records the processor is allowed to fetch on its own, e.g. the session start
 *                          of a session the loaded page only holds the tail of
 */
function createProcessor(additionalRecords: TrafficRecord[] = []): TrafficRecordHistoryVisualisationProcessor {
    const visualisers: ImmutableList<TrafficRecordVisualiser<TrafficRecord>> = ImmutableList([
        new SessionStartContainerVisualiser(unusedService, unusedService),
        new SessionCloseContainerVisualiser(),
        new QueryContainerVisualiser(unusedService, unusedService)
    ] as TrafficRecordVisualiser<TrafficRecord>[])
    const evitaClient: EvitaClient = {
        queryCatalog: <T>(_catalogName: string, logic: (session: {
            getRecordings(): Promise<ImmutableList<TrafficRecord>>
        }) => Promise<T>): Promise<T> => logic({
            getRecordings: () => Promise.resolve(ImmutableList(additionalRecords))
        })
    } as unknown as EvitaClient
    return new TrafficRecordHistoryVisualisationProcessor(evitaClient, visualisers)
}

function sessionStart(sessionId: Uuid, offset: number): SessionStartContainer {
    return new SessionStartContainer(
        1n, sessionId, offset, 3, TrafficRecordType.SessionStart, created, noDuration, 0, 0, undefined, 1n
    )
}

function query(sessionId: Uuid, offset: number): QueryContainer {
    return new QueryContainer(
        1n, sessionId, offset, 3, TrafficRecordType.Query, created, noDuration, 0, 0, undefined,
        'Product query', 'query(collection("Product"))', 10, ImmutableList([1, 2]), ImmutableList()
    )
}

function sessionClose(sessionId: Uuid, offset: number): SessionCloseContainer {
    return new SessionCloseContainer(
        1n, sessionId, offset, 3, TrafficRecordType.SessionClose, created, noDuration, 0, 0, undefined,
        42n, 3, 1, 0, 0
    )
}

/**
 * Guards the split between the order records are processed in and the order they are rendered in: the
 * history list shows the newest records first, but the records must reach the visualisers oldest first,
 * otherwise a query is not attached to its session and the session close statistics are dropped.
 */
describe('record processing order', () => {
    test('attaches a query to its session and merges the close statistics', async () => {
        const sessionId: Uuid = Uuid.fromCode('bfd5c4d0-3b3f-4f5b-9f0e-2f34d5f2a111')
        const records: TrafficRecord[] = [
            sessionStart(sessionId, 0),
            query(sessionId, 1),
            sessionClose(sessionId, 2)
        ]

        const history: ImmutableList<TrafficRecordVisualisationDefinition> = await createProcessor().process(
            catalogName,
            new TrafficRecordHistoryCriteria(),
            records
        )

        expect(history.size).toEqual(1)
        const visualisedSession: TrafficRecordVisualisationDefinition = history.get(0)!
        expect(visualisedSession.source).toBe(records[0])
        expect(visualisedSession.children.size).toEqual(1)
        expect(visualisedSession.children.get(0)!.source).toBe(records[1])

        // the close statistics replace the "no statistics" placeholder of the session start
        expect(visualisedSession.defaultMetadata!.items.map(item => item.value)).toContain('42')
        expect(visualisedSession.defaultMetadata!.items.map(item => item.identifier))
            .not.toContain('noStatistics')
    })

    // a page read backwards ends in the middle of a session, so its oldest records arrive without their
    // session start; the processor fetches the start separately and has to place it before all of them
    test('nests records of a session whose start is beyond the page boundary', async () => {
        const sessionId: Uuid = Uuid.fromCode('bfd5c4d0-3b3f-4f5b-9f0e-2f34d5f2a444')
        const missingStart: SessionStartContainer = sessionStart(sessionId, 0)
        const records: TrafficRecord[] = [
            query(sessionId, 1),
            sessionClose(sessionId, 2)
        ]

        const history: ImmutableList<TrafficRecordVisualisationDefinition> =
            await createProcessor([missingStart]).process(
                catalogName,
                new TrafficRecordHistoryCriteria(),
                records
            )

        expect(history.size).toEqual(1)
        const visualisedSession: TrafficRecordVisualisationDefinition = history.get(0)!
        expect(visualisedSession.source).toBe(missingStart)
        expect(visualisedSession.children.size).toEqual(1)
        expect(visualisedSession.children.get(0)!.source).toBe(records[0])
        expect(visualisedSession.defaultMetadata!.items.map(item => item.value)).toContain('42')
    })

    // this is what the list would look like if the display order leaked into the processing
    test('loses the session grouping when records are processed newest first', async () => {
        const sessionId: Uuid = Uuid.fromCode('bfd5c4d0-3b3f-4f5b-9f0e-2f34d5f2a222')
        const records: TrafficRecord[] = [
            sessionClose(sessionId, 2),
            query(sessionId, 1),
            sessionStart(sessionId, 0)
        ]

        const history: ImmutableList<TrafficRecordVisualisationDefinition> = await createProcessor().process(
            catalogName,
            new TrafficRecordHistoryCriteria(undefined, [UserTrafficRecordType.Query]),
            records
        )

        // the query ends up as its own root instead of a child of the session
        expect(history.size).toEqual(2)
        expect(history.get(0)!.source).toBe(records[1])
        expect(history.get(1)!.source).toBe(records[2])
    })
})
