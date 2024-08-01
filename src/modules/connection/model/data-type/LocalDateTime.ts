import { PerttyPrintable } from "./PrettyPrintable"

// todo docs
export class LocalDateTime implements PerttyPrintable {
    readonly isoDate: string
    constructor(isoDate: string) {
        this.isoDate = isoDate
    }

    getPrettyPrintableString(): string {
        const localDateTimeFormatter = new Intl.DateTimeFormat([], {
            dateStyle: 'medium',
            timeStyle: 'medium',
        })
        return localDateTimeFormatter.format(new Date(this.isoDate))
    }

    toString():string{
        return this.isoDate
    }
}
