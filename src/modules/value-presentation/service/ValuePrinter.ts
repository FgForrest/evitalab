/**
 * Prints values of one type as human-readable text.
 *
 * @typeParam T type of the printed values
 * @typeParam C context supplied by the caller (e.g. the selected price type), `void` when the printer needs none
 */
export interface ValuePrinter<T, C = void> {
    /**
     * Returns the human-readable text of the value. Never called with `null` or `undefined`.
     */
    print(value: T, context: C): string
}
