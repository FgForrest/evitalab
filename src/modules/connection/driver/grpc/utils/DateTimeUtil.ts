import { GrpcDateTimeRange } from "@/modules/connection/driver/grpc/gen/GrpcEvitaDataTypes_pb"
import { DateTimeRange } from "@/modules/connection/model/data-type/DateTimeRange"
import { OffsetDateTime } from "@/modules/connection/model/data-type/OffsetDateTime"


//TODO: Add doc
export class DateTimeUtil {
    static convertToDateTimeRange(
        dateTimeRange: GrpcDateTimeRange
    ): DateTimeRange {
        const defaultZoneOffset: string = 'UTC'
        const fromSet = !!dateTimeRange.from
        const toSet = !!dateTimeRange.to
        const fromTimestamp = dateTimeRange.from?.timestamp?.seconds ?? 0
        const toTimestamp = dateTimeRange.to?.timestamp?.seconds ?? 0

        const from = OffsetDateTime.ofInstant(
            fromTimestamp as bigint,
            fromSet
                ? dateTimeRange.from?.offset ?? defaultZoneOffset
                : defaultZoneOffset
        )
        const to = OffsetDateTime.ofInstant(
            toTimestamp as bigint,
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