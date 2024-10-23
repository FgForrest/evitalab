import { PrettyPrintable } from "./PrettyPrintable";

//TODO: Add docs
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