import { describe, expect, test } from 'vitest'
import { TrafficRecordHistoryCursor } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCursor'

describe('TrafficRecordHistoryCursor', () => {
    test('starts at the newest end of the history', () => {
        const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor()

        expect(cursor.sinceSessionSequenceId).toBeUndefined()
        expect(cursor.sinceRecordSessionOffset).toBeUndefined()
        expect(cursor.exhausted).toBe(false)
    })

    test('steps to the preceding record within the same session', () => {
        const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor()

        cursor.moveBefore(5n, 3)

        expect(cursor.sinceSessionSequenceId).toEqual(5n)
        expect(cursor.sinceRecordSessionOffset).toEqual(2)
        expect(cursor.exhausted).toBe(false)
    })

    // the server applies `recordSessionOffset <= sinceRecordSessionOffset` on the boundary session only,
    // so sending 0 here would return just the first record of the preceding session instead of all of it
    test('leaves the record offset unset when crossing a session boundary', () => {
        const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor()

        cursor.moveBefore(5n, 0)

        expect(cursor.sinceSessionSequenceId).toEqual(4n)
        expect(cursor.sinceRecordSessionOffset).toBeUndefined()
        expect(cursor.exhausted).toBe(false)
    })

    test('is exhausted below the first session', () => {
        const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor()

        cursor.moveBefore(1n, 1)
        expect(cursor.exhausted).toBe(false)

        cursor.moveBefore(1n, 0)
        expect(cursor.sinceSessionSequenceId).toEqual(0n)
        expect(cursor.exhausted).toBe(true)
    })

    test('reset returns the cursor to the newest end', () => {
        const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor()
        cursor.moveBefore(1n, 0)

        cursor.reset()

        expect(cursor.sinceSessionSequenceId).toBeUndefined()
        expect(cursor.sinceRecordSessionOffset).toBeUndefined()
        expect(cursor.exhausted).toBe(false)
    })

    describe('with a start pointer floor', () => {
        test('stops paging below the floor session', () => {
            const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor(10n)

            cursor.moveBefore(10n, 2)
            expect(cursor.sinceSessionSequenceId).toEqual(10n)
            expect(cursor.exhausted).toBe(false)

            cursor.moveBefore(10n, 0)
            expect(cursor.sinceSessionSequenceId).toEqual(9n)
            expect(cursor.exhausted).toBe(true)
        })

        test('excludes records of sessions below the floor', () => {
            const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor(10n)

            expect(cursor.covers(11n)).toBe(true)
            expect(cursor.covers(10n)).toBe(true)
            expect(cursor.covers(9n)).toBe(false)
        })

        test('covers the whole history without a floor', () => {
            const cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor()

            expect(cursor.covers(1n)).toBe(true)
        })
    })
})
