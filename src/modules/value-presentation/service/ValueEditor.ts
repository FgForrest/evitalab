/**
 * Converts values of one type to and from the plain text an editor works with.
 *
 * @typeParam T type of the edited values
 * @typeParam C context supplied by the caller, `void` when the editor needs none
 */
export interface ValueEditor<T, C = void> {
    /**
     * Returns the text the editor starts with for the value.
     */
    toEditRepresentation(value: T, context: C): string

    /**
     * Parses the edited text back into a value. Throws an error with a translated message when the text is not
     * a valid value.
     */
    parse(representation: string, context: C): T
}
