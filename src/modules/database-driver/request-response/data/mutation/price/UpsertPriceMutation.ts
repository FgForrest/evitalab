import  { type BigDecimal } from '@/modules/database-driver/data-type/BigDecimal.ts'
import  { type DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange.ts'
import { PriceMutation } from '@/modules/database-driver/request-response/data/mutation/price/PriceMutation.ts'
import type { PriceKey } from '@/modules/database-driver/request-response/data/mutation/price/PriceKey.ts'

export class UpsertPriceMutation extends PriceMutation
{
    static readonly TYPE = 'upsertPriceMutation' as const

    /**
     * Undefined when the price is not bound to any inner record, mirrors the nullable `Integer innerRecordId` of the
     * evitaDB Java model. Note that `0` is a legal inner record id and must not be treated as an absent value.
     */
    readonly innerRecordId: number|undefined
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
