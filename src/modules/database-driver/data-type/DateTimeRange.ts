import { OffsetDateTime } from "./OffsetDateTime"
import { Range } from "./Range"

const emptyRangeEndSymbol: string = '∞'

/**
 * Range type that envelopes {@link OffsetDateTime} types.
 */
export class DateTimeRange extends Range<OffsetDateTime> {

    constructor(from?: OffsetDateTime, to?: OffsetDateTime) {
        super(from, to)
    }

    protected override assertValidity(from?: OffsetDateTime, to?: OffsetDateTime): void {
        super.assertValidity(from, to)
        if (from != undefined && to != undefined && from.toDateTime().toMillis() > to.toDateTime().toMillis()) {
            throw new Error(`Invalid range: from (${from.toString()}) cannot be greater than to (${to.toString()})`)
        }
    }

    getPrettyPrintableString(): string {
        const formattedFrom: string = this.from != undefined
            ? DateTimeRange.formatEnd(this.from)
            : emptyRangeEndSymbol
        const formattedTo: string = this.to != undefined
            ? DateTimeRange.formatEnd(this.to)
            : emptyRangeEndSymbol
        return `[${formattedFrom},${formattedTo}]`
    }

    /**
     * Formats a single range end in its own time offset, the same way {@link OffsetDateTime} does, only with
     * a longer date style suitable for ranges.
     */
    private static formatEnd(end: OffsetDateTime): string {
        return end.toDateTime().toLocaleString({
            dateStyle: 'medium',
            timeStyle: 'long',
        })
    }

    static until(to: OffsetDateTime): DateTimeRange {
        return new DateTimeRange(undefined, to)
    }

    static since(from: OffsetDateTime): DateTimeRange {
        return new DateTimeRange(from, undefined)
    }

    static between(from: OffsetDateTime, to: OffsetDateTime): DateTimeRange {
        return new DateTimeRange(from, to)
    }

    getRangeValues():[OffsetDateTime | undefined, OffsetDateTime | undefined]{
        return [this.from, this.to]
    }

    override toString():string{
        return `[${this.from ?? emptyRangeEndSymbol},${this.to ?? emptyRangeEndSymbol}]`
    }
}
