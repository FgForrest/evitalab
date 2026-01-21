import { OffsetDateTime } from "./OffsetDateTime"
import { Range } from "./Range"

const emptyRangeEndSymbol: any = '∞'

/**
 * Range type that envelopes {@link OffsetDateTime} types.
 */
export class DateTimeRange extends Range<OffsetDateTime> {

    constructor(from?: OffsetDateTime, to?: OffsetDateTime) {
        super(from, to)
    }

    protected assertValidity(from?: OffsetDateTime, to?: OffsetDateTime): void {
        super.assertValidity(from, to)
        if (from != undefined && to != undefined && from.toDateTime().toMillis() > to.toDateTime().toMillis()) {
            throw new Error(`Invalid range: from (${from.toString()}) cannot be greater than to (${to.toString()})`)
        }
    }

    getPrettyPrintableString(): string {
        const offsetDateTimeFormatter = new Intl.DateTimeFormat([], {
            dateStyle: 'medium',
            timeStyle: 'long',
        })
        const formattedFrom: string = this.from != undefined
            ? offsetDateTimeFormatter.format(this.from.timestamp.toDate())
            : emptyRangeEndSymbol
        const formattedTo: string = this.to != undefined
            ? offsetDateTimeFormatter.format(this.to.timestamp.toDate())
            : emptyRangeEndSymbol
        return `[${formattedFrom},${formattedTo}]`
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
