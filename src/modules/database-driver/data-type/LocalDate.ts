import { PrettyPrintable } from "./PrettyPrintable";

/**
 * A date without a time-zone in the ISO-8601 calendar system, such as 2007-12-03.
 */
export class LocalDate implements PrettyPrintable {
    readonly isoDate: string;

    constructor(isoDate: string){
        this.isoDate = isoDate
    }
    getPrettyPrintableString(): string {
        throw new Error("Method not implemented.");
    }

    toString():string{
        return this.isoDate;
    }
}
