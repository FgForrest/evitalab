import { Timestamp } from '@bufbuild/protobuf'
import { DateTime } from 'luxon'
import { PrettyPrintable } from './PrettyPrintable'

const offsetDateTimeFormatter = new Intl.DateTimeFormat([], {
    dateStyle: 'short',
    timeStyle: 'long',
})

//TODO add doc
// todo lho we should try to replace this with luxon's DateTime
export class OffsetDateTime implements PrettyPrintable {
    readonly timestamp?: Timestamp
    readonly offset?: string

    // todo lho this is not optional
    constructor(timestamp?: Timestamp, offset?: string) {
        this.timestamp = timestamp
        this.offset = offset
    }
    getPrettyPrintableString(): string {
        // todo lho verify this, i think the final date should contain the offset as well
        return `${offsetDateTimeFormatter.format(this.timestamp?.toDate())}`
    }
    static ofInstant(instant: bigint, offset: string): OffsetDateTime {
        const timestamp = new Timestamp()
        timestamp.seconds = instant
        return new OffsetDateTime(timestamp, offset)
    }

    toString():string{
        return DateTime.fromSeconds(Number(this.timestamp?.seconds), {zone: this.offset }).toISO({includeOffset: true})
    }
}
