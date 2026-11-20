import { ResultSizeUnit } from '@/modules/console/result-status/model/ResultSizeUnit'

/**
 * A size scaled to the unit it is displayed in.
 */
export interface FormattedResultSize {
    readonly unit: ResultSizeUnit
    readonly value: string
}

/**
 * Scales a byte count for display: whole bytes below 1 KiB, one decimal place in kB below 1 MiB, MB above.
 */
export function formatResultSize(sizeBytes: number): FormattedResultSize {
    if (sizeBytes < 1024) {
        return { unit: ResultSizeUnit.Bytes, value: String(sizeBytes) }
    }
    if (sizeBytes < 1024 * 1024) {
        return { unit: ResultSizeUnit.Kilobytes, value: (sizeBytes / 1024).toFixed(1) }
    }
    return { unit: ResultSizeUnit.Megabytes, value: (sizeBytes / (1024 * 1024)).toFixed(1) }
}

/**
 * Whole milliseconds of a measured duration.
 */
export function formatResultDuration(durationMs: number): string {
    return String(Math.round(durationMs))
}

/**
 * Size of a text in bytes when encoded as UTF-8, which is what travels over the wire.
 */
export function utf8ByteLength(text: string): number {
    return new TextEncoder().encode(text).byteLength
}
