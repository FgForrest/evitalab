/**
 * Marks a tab request as executable. This means that user data in that tab can be executed, e.g., a query can be executed.
 */
export interface ExecutableTabRequest {
    /**
     * Indicates whether the tab should be executed automatically when it is opened. Usually, some initial user data
     * should be passed.
     */
    readonly executeOnOpen: boolean
}
