import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { Currency } from '@/modules/database-driver/data-type/Currency'

/**
 * Prices are specific to a very few entities, but because correct price computation is very complex in e-commerce systems
 * and highly affects performance of the entities filtering and sorting, they deserve first class support in entity model.
 * It is pretty common in B2B systems single product has assigned dozens of prices for the different customers.
 */
export class Price {
    readonly priceId: number
    readonly priceList: string
    readonly innerRecordId: number | undefined
    readonly priceWithoutTax: BigDecimal
    readonly taxRate: BigDecimal
    readonly priceWithTax: BigDecimal
    readonly validity: DateTimeRange | undefined
    readonly sellable: boolean
    readonly version: number
    readonly currency: Currency

    constructor(priceId: number,
                priceList: string,
                innerRecordId: number | undefined,
                priceWithoutTax: BigDecimal,
                taxRate: BigDecimal,
                priceWithTax: BigDecimal,
                validity: DateTimeRange | undefined,
                sellable: boolean,
                version: number,
                currency: Currency) {
        this.priceId = priceId;
        this.priceList = priceList;
        this.innerRecordId = innerRecordId;
        this.priceWithoutTax = priceWithoutTax;
        this.taxRate = taxRate;
        this.priceWithTax = priceWithTax;
        this.validity = validity;
        this.sellable = sellable;
        this.version = version;
        this.currency = currency
    }
}
