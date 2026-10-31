import { List as ImmutableList } from 'immutable'
import type { ValuePrinter } from '@/modules/value-presentation/service/ValuePrinter'

/**
 * Prints an array value item by item as `[a, b]`; a missing item prints as an empty string. The driver represents
 * arrays as immutable lists, plain arrays are accepted too.
 */
export class ArrayValuePrinter<T> implements ValuePrinter<ImmutableList<T> | readonly T[]> {
    private readonly itemPrinter: ValuePrinter<T>

    constructor(itemPrinter: ValuePrinter<T>) {
        this.itemPrinter = itemPrinter
    }

    print(value: ImmutableList<T> | readonly T[]): string {
        const items: readonly T[] = ImmutableList.isList(value) ? (value as ImmutableList<T>).toArray() : value as readonly T[]
        return `[${items.map(item => item == undefined ? '' : this.itemPrinter.print(item)).join(', ')}]`
    }
}
