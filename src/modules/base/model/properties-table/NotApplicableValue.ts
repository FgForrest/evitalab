/**
 * Actual specific value of a property representing a value that is not applicable for the current item.
 */
export class NotApplicableValue {
    /**
     * Explanation why this value is not applicable
     */
    readonly explanation?: string

    constructor(explanation?: string) {
        this.explanation = explanation
    }

    toString() {
        return this.explanation
    }
}
