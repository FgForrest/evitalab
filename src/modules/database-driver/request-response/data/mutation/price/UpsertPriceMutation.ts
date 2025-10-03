import  { type BigDecimal } from '@/modules/database-driver/data-type/BigDecimal.ts'
import  { type DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange.ts'
import { PriceMutation } from '@/modules/database-driver/request-response/data/mutation/price/PriceMutation.ts'
import type { PriceKey } from '@/modules/database-driver/request-response/data/mutation/price/PriceKey.ts'

export class UpsertPriceMutation extends PriceMutation
{
    readonly innerRecordId: number|undefined // todo pfi: not sure about the undefined
    readonly priceWithoutTax: BigDecimal
    readonly taxRate: BigDecimal
    readonly priceWithTax: BigDecimal
    readonly validity: DateTimeRange|undefined
    readonly indexed: boolean


    constructor(priceKey: PriceKey, innerRecordId: number|undefined, priceWithoutTax: BigDecimal, taxRate: BigDecimal, priceWithTax: BigDecimal, validity: DateTimeRange|undefined, indexed: boolean) {
        super(priceKey)
        this.innerRecordId = innerRecordId
        this.priceWithoutTax = priceWithoutTax
        this.taxRate = taxRate
        this.priceWithTax = priceWithTax
        this.validity = validity
        this.indexed = indexed
    }
}
