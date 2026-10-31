import type { ValuePrinter } from '@/modules/value-presentation/service/ValuePrinter'
import type { Range } from '@/modules/database-driver/data-type/Range'

/**
 * Symbol printed in place of an open range end.
 */
const openRangeEndSymbol: string = '∞'

/**
 * Text around and between the ends of a printed range.
 */
export interface RangeTextFormat {
    readonly prefix: string
    readonly separator: string
    readonly suffix: string
}

/**
 * Prints a range by printing its ends with the printer of the end type; an open end prints as `∞`.
 */
export class RangeValuePrinter<E> implements ValuePrinter<Range<E>> {
    private readonly endPrinter: ValuePrinter<E>
    private readonly textFormat: RangeTextFormat

    constructor(endPrinter: ValuePrinter<E>, textFormat: RangeTextFormat) {
        this.endPrinter = endPrinter
        this.textFormat = textFormat
    }

    print(value: Range<E>): string {
        const [from, to] = value.getRangeValues()
        return this.textFormat.prefix +
            this.printEnd(from) +
            this.textFormat.separator +
            this.printEnd(to) +
            this.textFormat.suffix
    }

    private printEnd(end: E | undefined): string {
        return end != undefined ? this.endPrinter.print(end) : openRangeEndSymbol
    }
}
