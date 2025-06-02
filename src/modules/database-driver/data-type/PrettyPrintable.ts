/**
 * Allows an object to be printed in a human-readable format.
 */
export interface PrettyPrintable {

    /**
     * Returns a string representation of the object that is suitable for human reading.
     */
    getPrettyPrintableString(): string;
}
