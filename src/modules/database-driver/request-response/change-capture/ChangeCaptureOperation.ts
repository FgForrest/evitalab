/**
 * Enumeration of possible mutation types handled by evitaDB.
 */
export enum ChangeCaptureOperation {
    /**
     * Create or update operation - i.e. there was data with such identity before, and it was updated.
     */
    Upsert = 'upsert',
    /**
     * Remove operation - i.e. there was data with such identity before, and it was removed.
     */
    Remove = 'remove',
    /**
     * Delimiting operation signaling the beginning of a transaction.
     */
    Transaction = 'transaction'
}