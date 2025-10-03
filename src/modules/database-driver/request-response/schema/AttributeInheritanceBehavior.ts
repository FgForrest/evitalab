/**
 * Enum specifies different modes for reference attributes inheritance in reflected schema.
 */
export enum AttributeInheritanceBehavior {
    /**
     * Inherit all attributes by default except those listed in the array.
     */
    InheritAllExcept = 0,
    /**
     * Do not inherit any attributes by default except those listed in the array.
     */
    InheritOnlySpecified = 1,
}
