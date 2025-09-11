import  { type BigDecimal } from '@/modules/database-driver/data-type/BigDecimal.ts'
import  { type DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange.ts'
import { PriceMutation } from '@/modules/database-driver/request-response/data/mutation/price/PriceMutation.ts'
import type { PriceKey } from '@/modules/database-driver/request-response/data/mutation/price/PriceKey.ts'

export class UpsertPriceMutation extends PriceMutation
{
    readonly innerRecordId: number
    readonly priceWithoutTax: BigDecimal
    readonly taxRate: BigDecimal
    readonly priceWithTax: BigDecimal
    readonly validity: DateTimeRange
    readonly indexed: boolean


    constructor(priceKey: PriceKey, innerRecordId: number, priceWithoutTax: BigDecimal, taxRate: BigDecimal, priceWithTax: BigDecimal, validity: DateTimeRange, indexed: boolean) {
        super(priceKey)
        this.innerRecordId = innerRecordId
        this.priceWithoutTax = priceWithoutTax
        this.taxRate = taxRate
        this.priceWithTax = priceWithTax
        this.validity = validity
        this.indexed = indexed
    }
}
