/**
 * Price inner record handling controls how prices that share same `inner entity id` will behave during filtering and sorting.
 */
export enum PriceInnerRecordHandling {
    None = 'None',
    LowestPrice = 'LowestPrice',
    Sum = 'Sum',
    Unknown = 'Unknown',
}
