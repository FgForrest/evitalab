import  { type BigDecimal } from '@/modules/database-driver/data-type/BigDecimal.ts'
import  { type DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange.ts'

export class UpsertPriceMutation
{
    readonly innerRecordId: number
    readonly priceWithoutTax: BigDecimal
    readonly taxRate: BigDecimal
    readonly priceWithTax: BigDecimal
    readonly validity: DateTimeRange
    readonly indexed: boolean

    constructor(innerRecordId: number, priceWithoutTax: BigDecimal, taxRate: BigDecimal, priceWithTax: BigDecimal, validity: DateTimeRange, indexed: boolean) {
        this.innerRecordId = innerRecordId
        this.priceWithoutTax = priceWithoutTax
        this.taxRate = taxRate
        this.priceWithTax = priceWithTax
        this.validity = validity
        this.indexed = indexed
    }
}
