import { DateTime } from 'luxon'

/**
 * Extracts ISO time offset from zoned date time
 */
export function timeOffsetFrom(dateTime: DateTime): string {
    return dateTime.toFormat('ZZ')
}
