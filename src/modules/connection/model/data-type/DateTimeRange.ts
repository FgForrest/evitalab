//TODO: Add documentation
import { OffsetDateTime } from "./OffsetDateTime"
import { PrettyPrintable } from "./PrettyPrintable"
import { Range } from "./Range"

const emptyRangeEndSymbol: any = '∞'

export class DateTimeRange extends Range<OffsetDateTime> implements PrettyPrintable {

    constructor(from?: OffsetDateTime, to?: OffsetDateTime) {
        super(from, to)
    }

    getPrettyPrintableString(): string {
        const offsetDateTimeFormatter = new Intl.DateTimeFormat([], {
            dateStyle: 'medium',
            timeStyle: 'long',
        })
        const formattedFrom: string = this.from != undefined
            ? offsetDateTimeFormatter.format(this.from.timestamp!.toDate())
            : emptyRangeEndSymbol
        const formattedTo: string = this.to != undefined
            ? offsetDateTimeFormatter.format(this.to.timestamp!.toDate())
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
