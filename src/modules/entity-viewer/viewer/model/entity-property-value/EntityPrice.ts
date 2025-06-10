import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import type {
    EntityPropertyValuePreviewStringContext
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValuePreviewStringContext'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { Price } from '@/modules/database-driver/request-response/data/Price'

/**
 * Represents a single entity price.
 */
// todo lho this should be probably in driver too and the computePrice logic aswell
export class EntityPrice extends EntityPropertyValue {
    readonly priceId: number | undefined
    readonly priceList: string
    readonly currency: Currency
    readonly innerRecordId?: number | undefined
    readonly sellable: boolean | undefined
    readonly validity?: DateTimeRange | undefined
    readonly priceWithoutTax: BigDecimal
    readonly priceWithTax: BigDecimal
    readonly taxRate: BigDecimal

    private constructor(priceId: number | undefined,
                priceList: string,
                currency: Currency,
                innerRecordId: number | undefined,
                sellable: boolean | undefined,
                validity: DateTimeRange | undefined,
                priceWithoutTax: BigDecimal,
                priceWithTax: BigDecimal,
                taxRate: BigDecimal) {
        super()
        this.priceId = priceId
        this.priceList = priceList
        this.currency = currency
        this.innerRecordId = innerRecordId
        this.sellable = sellable
        this.validity = validity
        this.priceWithoutTax = priceWithoutTax
        this.priceWithTax = priceWithTax
        this.taxRate = taxRate
    }

    static fromPrice(price: Price): EntityPrice {
        return new EntityPrice(
            price.priceId,
            price.priceList,
            price.currency,
            price.innerRecordId,
            price.sellable,
            price.validity,
            price.priceWithoutTax,
            price.priceWithTax,
            price.taxRate
        )
    }

    static fromJson(json: any): EntityPrice {
        return new EntityPrice(json.priceId,
            json.priceList,
            json.currency,
            json.innerRecordId,
            json.sellable,
            json.validity,
            json.priceWithoutTax,
            json.priceWithTax,
            json.taxRate)
    }

    value(): any {
        return this
    }

    isEmpty(): boolean {
        return false
    }

    toPreviewString(context: EntityPropertyValuePreviewStringContext): string {
        const priceFormatter = new Intl.NumberFormat(
            navigator.language,
            { style: 'currency', currency: this.currency.code, maximumFractionDigits: 2 }
        )
        const actualPriceType: QueryPriceMode = context?.priceType != undefined ? context.priceType : QueryPriceMode.WithTax
        const price: BigDecimal | undefined = actualPriceType === QueryPriceMode.WithTax ? this.priceWithTax : this.priceWithoutTax
        return priceFormatter.format(parseFloat(price?.value ?? '0'))
    }
}
