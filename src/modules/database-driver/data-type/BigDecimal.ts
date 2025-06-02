/**
 * Immutable, arbitrary-precision signed decimal numbers
 */
export class BigDecimal {
    readonly value: string

    constructor(value: string){
        this.value = value
    }

    toFloat(): number {
        return parseFloat(this.value)
    }

    toString():string{
        return this.value
    }
}
