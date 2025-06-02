/**
 * Represents a currency. Currencies are identified by their ISO 4217 currency codes.
 */
export class Currency {
    code: string

    constructor(code: string){
        this.code = code;
    }

    toString():string{
        return this.code;
    }
}
