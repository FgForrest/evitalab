import { test, expect, describe } from 'vitest'
import { LocalDate } from '@/modules/database-driver/data-type/LocalDate'
import { LocalTime } from '@/modules/database-driver/data-type/LocalTime'
import { LocalDateTime } from '@/modules/database-driver/data-type/LocalDateTime'
import { EvitaValuePrinter } from '@/modules/value-presentation/service/EvitaValuePrinter'

const evitaValuePrinter: EvitaValuePrinter = new EvitaValuePrinter()

/**
 * The entity grid renders cells through `EvitaValuePrinter`, which has no error handling of its own. `LocalDate`
 * used to throw "Method not implemented." and `LocalTime` fed a bare ISO time to `new Date(...)` and threw
 * "Invalid time value", so a single attribute of either type broke the cell.
 */
describe('Local date-time values', () => {
    test('Should pretty print a local date without shifting the day', () => {
        const prettyPrinted: string = evitaValuePrinter.print(new LocalDate('2026-08-26'))

        expect(prettyPrinted).toContain('2026')
        expect(prettyPrinted).toContain('26')
    })

    test('Should pretty print a local time', () => {
        const prettyPrinted: string = evitaValuePrinter.print(new LocalTime('10:15:30'))

        expect(prettyPrinted).toContain('15')
        expect(prettyPrinted).toContain('30')
    })

    test('Should pretty print a local date time', () => {
        const prettyPrinted: string = evitaValuePrinter.print(new LocalDateTime('2026-08-26T10:15:30'))

        expect(prettyPrinted).toContain('2026')
        expect(prettyPrinted).toContain('15')
    })

    test('Should degrade an unparseable value instead of throwing', () => {
        expect(() => evitaValuePrinter.print(new LocalDate('not-a-date'))).not.toThrow()
        expect(() => evitaValuePrinter.print(new LocalTime('not-a-time'))).not.toThrow()
    })
})
