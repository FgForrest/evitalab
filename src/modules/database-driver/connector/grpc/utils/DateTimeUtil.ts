import type { GrpcDateTimeRange } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'

export class DateTimeUtil {
    static convertToDateTimeRange(
        dateTimeRange: GrpcDateTimeRange
    ): DateTimeRange {
        const defaultZoneOffset: string = 'UTC'
        const fromSet = !!dateTimeRange.from
        const toSet = !!dateTimeRange.to
        const from = OffsetDateTime.of(
            dateTimeRange.from?.timestamp?.seconds ?? BigInt(0),
            dateTimeRange.from?.timestamp?.nanos ?? 0,
            fromSet
                ? dateTimeRange.from?.offset ?? defaultZoneOffset
                : defaultZoneOffset
        )
        const to = OffsetDateTime.of(
            dateTimeRange.to?.timestamp?.seconds ?? BigInt(0),
            dateTimeRange.to?.timestamp?.nanos ?? 0,
            toSet
                ? dateTimeRange.to?.offset ?? defaultZoneOffset
                : defaultZoneOffset
        )

        if (!fromSet && toSet) {
            return DateTimeRange.until(to)
        } else if (fromSet && !toSet) {
            return DateTimeRange.since(from)
        }
        return DateTimeRange.between(from, to)
    }
}
