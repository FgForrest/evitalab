import { PrettyPrintable } from "./PrettyPrintable"

//TODO: Add documentation
export class LocalTime implements PrettyPrintable {
    readonly isoTime : string

    constructor(isoTime: string){
        this.isoTime = isoTime
    }
    getPrettyPrintableString(): string {
        const localTimeFormatter = new Intl.DateTimeFormat([], { timeStyle: 'medium' })
        return localTimeFormatter.format(new Date(this.isoTime))
    }

    toString():string{
        return this.isoTime
    }
}