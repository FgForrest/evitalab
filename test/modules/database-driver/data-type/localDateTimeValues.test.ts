import { test, expect, describe } from 'vitest'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { LocalTime } from '@/modules/database-driver/data-type/LocalTime'
import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'

/**
 * The entity grid renders cells through `NativeValue.toPrettyPrintString()`, which delegates to
 * `getPrettyPrintableString()` of every value implementing `PrettyPrintable` and has no error handling
 * of its own. `LocalDate` used to throw "Method not implemented." and `LocalTime` fed a bare ISO time to
 * `new Date(...)` and threw "Invalid time value", so a single attribute of either type broke the cell.
 */
describe('Local date-time values', () => {
    test('Should pretty print a local date without shifting the day', () => {
        const prettyPrinted: string = new LocalDate('2026-08-26').getPrettyPrintableString()

        expect(prettyPrinted).toContain('2026')
        expect(prettyPrinted).toContain('26')
    })

    test('Should pretty print a local time', () => {
        const prettyPrinted: string = new LocalTime('10:15:30').getPrettyPrintableString()

        expect(prettyPrinted).toContain('15')
        expect(prettyPrinted).toContain('30')
    })

    test('Should pretty print a local date time', () => {
        const prettyPrinted: string = new LocalDateTime('2026-08-26T10:15:30').getPrettyPrintableString()

        expect(prettyPrinted).toContain('2026')
        expect(prettyPrinted).toContain('15')
    })

    test('Should not throw when the grid pretty prints them', () => {
        expect(() => new NativeValue(new LocalDate('2026-08-26')).toPrettyPrintString()).not.toThrow()
        expect(() => new NativeValue(new LocalTime('10:15:30')).toPrettyPrintString()).not.toThrow()
        expect(() => new NativeValue(new LocalDateTime('2026-08-26T10:15:30')).toPrettyPrintString()).not.toThrow()
    })

    test('Should degrade an unparseable value instead of throwing', () => {
        expect(() => new LocalDate('not-a-date').getPrettyPrintableString()).not.toThrow()
        expect(() => new LocalTime('not-a-time').getPrettyPrintableString()).not.toThrow()
    })
})
