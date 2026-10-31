import type { ValuePrinter } from '@/modules/value-presentation/service/ValuePrinter'

/**
 * Prints values of one `database-driver` data type through a format function.
 */
export class DataTypeValuePrinter<T> implements ValuePrinter<T> {
    private readonly format: (value: T) => string

    constructor(format: (value: T) => string) {
        this.format = format
    }

    print(value: T): string {
        return this.format(value)
    }
}
