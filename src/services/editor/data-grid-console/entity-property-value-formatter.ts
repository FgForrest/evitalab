/**
 * Tries to format entity property raw value into implementation-defined-formatted string.
 */
export interface EntityPropertyValueFormatter {
    /**
     * Tries to format raw value into formatted string, either raw (validated according to implemenation of formatter)
     * or pretty printed.
     *
     * @param value raw value to format
     * @param prettyPrint whether to pretty print the value
     */
    format(value: any, prettyPrint?: boolean): string;
}

