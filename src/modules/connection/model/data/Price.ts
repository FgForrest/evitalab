import { BigDecimal } from "../data-type/BigDecimal";
import { DateTimeRange } from "../data-type/DateTimeRange";
import { Currency } from '@/modules/connection/model/data-type/Currency'

//TODO: Add documentation
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
