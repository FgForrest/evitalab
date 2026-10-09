import { formatByteSize } from '@/utils/string'
import { i18n } from '@/vue-plugins/i18n'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Duration } from 'luxon'

/**
 * Formatting helpers shared by the catalog viewer pages.
 *
 * They exist to keep one rule in one place: **a value the engine does not have is rendered as an em-dash
 * placeholder, never as `0`.** Every accessor here that takes an optional value applies it.
 */

const countFormatter: Intl.NumberFormat = new Intl.NumberFormat(navigator.language)
const rateFormatter: Intl.NumberFormat = new Intl.NumberFormat(
    navigator.language,
    { maximumFractionDigits: 2 }
)
const percentFormatter: Intl.NumberFormat = new Intl.NumberFormat(
    navigator.language,
    { style: 'percent', maximumFractionDigits: 1 }
)
const smallPercentFormatter: Intl.NumberFormat = new Intl.NumberFormat(
    navigator.language,
    { style: 'percent', maximumSignificantDigits: 2 }
)

/**
 * The em-dash placeholder for a value that does not apply or could not be determined.
 */
export function notApplicable(): string {
    return i18n.global.t('catalogViewer.placeholder.notApplicable')
}

export function formatBytes(bytes: bigint | number | undefined): string {
    return bytes == undefined ? notApplicable() : formatByteSize(Number(bytes))
}

export function formatNumber(value: bigint | number | undefined): string {
    return value == undefined ? notApplicable() : countFormatter.format(value)
}

export function formatRate(value: number | undefined): string {
    return value == undefined ? notApplicable() : rateFormatter.format(value)
}

export function formatPercent(share: number | undefined): string {
    return share == undefined ? notApplicable() : percentFormatter.format(share)
}

/**
 * Share of something that is expected to be rare. Two significant digits are kept, so a share of one in a few
 * thousand reads `0.065 %` instead of rounding to `0 %` the way {@link formatPercent} would - and a share that is
 * genuinely zero still reads `0 %`.
 */
export function formatSmallPercent(share: number | undefined): string {
    return share == undefined ? notApplicable() : smallPercentFormatter.format(share)
}

export function formatDateTime(dateTime: OffsetDateTime | undefined): string {
    return dateTime == undefined ? notApplicable() : dateTime.getPrettyPrintableString()
}

/**
 * The statistics durations are millisecond-scale - a checkpoint cadence, a fence depth, the time a force took.
 * `toHuman` stops at whole seconds by default (see `vue-plugins/luxonExtensions`), which would report a 214 ms
 * force as `0 sec` and a cadence of 1 017 ms as `1 sec` next to a configured interval of `1 sec`, so the smallest
 * unit is asked for explicitly.
 */
export function formatDuration(milliseconds: bigint | number | undefined): string {
    if (milliseconds == undefined) {
        return notApplicable()
    }
    return Duration.fromMillis(Number(milliseconds))
        .rescale()
        .toHuman({ unitDisplay: 'short', smallestUnit: 'milliseconds' })
}

/**
 * Share of `part` in `total`, or `undefined` when the total is zero — a zero total makes the share meaningless
 * rather than `0`.
 */
export function share(part: bigint, total: bigint): number | undefined {
    return total === 0n ? undefined : Number(part) / Number(total)
}
