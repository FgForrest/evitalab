export enum Operation {
    Upsert = 'upsert',
    Remove = 'remove',
    Transaction = 'transaction',
    /** Fallback for an operation a newer server reports that this client does not know yet. */
    Unknown = 'unknown',
}
