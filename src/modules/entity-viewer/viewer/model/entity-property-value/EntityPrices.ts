import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import type {
    EntityPropertyValuePreviewStringContext
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValuePreviewStringContext'
import { QueryPriceMode } from '../QueryPriceMode'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'

/**
 * Holder for entity prices displayable data grid.
 */
export class EntityPrices extends EntityPropertyValue {
    readonly priceForSale?: EntityPrice
    readonly prices: EntityPrice[]

    constructor(priceForSale: EntityPrice | undefined, prices: EntityPrice[]) {
        super()
        this.priceForSale = priceForSale
        this.prices = prices
    }

    count(): number {
        return this.prices.length
    }

    value(): any {
        return this
    }

    isEmpty(): boolean {
        return false
    }

    toRawString(): string {
        return JSON.stringify({ priceForSale: this.priceForSale, prices: this.prices })
    }

    toPreviewString(context?: EntityPropertyValuePreviewStringContext): string {
        let previewString: string = ''

        if (this.priceForSale != undefined) {
            const priceFormatter = new Intl.NumberFormat(
                navigator.language,
                { style: 'currency', currency: this.priceForSale.currency.code, maximumFractionDigits: 2 }
            )
            const actualPriceType: QueryPriceMode = context?.priceType != undefined ? context.priceType : QueryPriceMode.WithTax
            const price: BigDecimal | undefined = actualPriceType === QueryPriceMode.WithTax ? this.priceForSale.priceWithTax : this.priceForSale.priceWithoutTax
            const formattedPrice: string = priceFormatter.format(parseFloat(price?.value ?? '0'))

            previewString += `${formattedPrice} with `
        }

        const allPricesCount = this.count()
        previewString += (allPricesCount === 1 ? `${allPricesCount} price` : `${allPricesCount} prices`)

        return previewString
    }
}
