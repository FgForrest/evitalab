import { Scalar } from "@/modules/connection/model/data-type/Scalar"
import { GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType, GrpcEvitaDataType } from '../gen/GrpcEnums_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

//TODO: Add docs
export class ScalarConverter{
    public static convertScalar(scalar: GrpcEvitaDataType): Scalar {
        switch (scalar) {
            case GrpcEvitaDataType.BIG_DECIMAL:
                return Scalar.BigDecimal
            case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE:
                return Scalar.BigDecimalNumberRange
            case GrpcEvitaDataType.BOOLEAN:
                return Scalar.Boolean
            case GrpcEvitaDataType.BYTE:
                return Scalar.Byte
            case GrpcEvitaDataType.BIG_DECIMAL_ARRAY:
                return Scalar.BigDecimalArray
            case GrpcEvitaDataType.BOOLEAN_ARRAY:
                return Scalar.BooleanArray
            case GrpcEvitaDataType.BIG_DECIMAL_NUMBER_RANGE_ARRAY:
                return Scalar.BigDecimalNumberRangeArray
            case GrpcEvitaDataType.BYTE_ARRAY:
                return Scalar.ByteArray
            case GrpcEvitaDataType.BYTE_NUMBER_RANGE:
                return Scalar.BigDecimalNumberRange
            case GrpcEvitaDataType.BYTE_NUMBER_RANGE_ARRAY:
                return Scalar.ByteNumberRangeArray
            case GrpcEvitaDataType.CHARACTER:
                return Scalar.Character
            case GrpcEvitaDataType.CHARACTER_ARRAY:
                return Scalar.CharacterArray
            case GrpcEvitaDataType.CURRENCY:
                return Scalar.Currency
            case GrpcEvitaDataType.CURRENCY_ARRAY:
                return Scalar.Currency
            case GrpcEvitaDataType.DATE_TIME_RANGE:
                return Scalar.DateTimeRange
            case GrpcEvitaDataType.DATE_TIME_RANGE_ARRAY:
                return Scalar.DateTimeRangeArray
            case GrpcEvitaDataType.INTEGER:
                return Scalar.Integer
            case GrpcEvitaDataType.INTEGER_ARRAY:
                return Scalar.IntegerArray
            case GrpcEvitaDataType.INTEGER_NUMBER_RANGE:
                return Scalar.IntegerNumberRange
            case GrpcEvitaDataType.INTEGER_NUMBER_RANGE_ARRAY:
                return Scalar.IntegerNumberRangeArray
            case GrpcEvitaDataType.LOCALE:
                return Scalar.Locale
            case GrpcEvitaDataType.LOCALE_ARRAY:
                return Scalar.LocaleArray
            case GrpcEvitaDataType.LOCAL_DATE:
                return Scalar.LocalDate
            case GrpcEvitaDataType.LOCAL_DATE_ARRAY:
                return Scalar.LocalDateArray
            case GrpcEvitaDataType.LOCAL_DATE_TIME:
                return Scalar.LocalDateTime
            case GrpcEvitaDataType.LOCAL_DATE_TIME_ARRAY:
                return Scalar.LocalDateTimeArray
            case GrpcEvitaDataType.LOCAL_TIME:
                return Scalar.LocalTime
            case GrpcEvitaDataType.LOCAL_TIME_ARRAY:
                return Scalar.LocalTimeArray
            case GrpcEvitaDataType.LONG:
                return Scalar.Long
            case GrpcEvitaDataType.LONG_ARRAY:
                return Scalar.LongArray
            case GrpcEvitaDataType.LONG_NUMBER_RANGE:
                return Scalar.LongNumberRange
            case GrpcEvitaDataType.LONG_NUMBER_RANGE_ARRAY:
                return Scalar.LongNumberRangeArray
            case GrpcEvitaDataType.OFFSET_DATE_TIME:
                return Scalar.OffsetDateTime
            case GrpcEvitaDataType.OFFSET_DATE_TIME_ARRAY:
                return Scalar.OffsetDateTimeArray
            case GrpcEvitaDataType.PREDECESSOR:
                return Scalar.Predecessor
            case GrpcEvitaDataType.REFERENCED_ENTITY_PREDECESSOR:
                return Scalar.ReferencedEntityPredecessor
            case GrpcEvitaDataType.SHORT:
                return Scalar.Short
            case GrpcEvitaDataType.SHORT_ARRAY:
                return Scalar.ShortArray
            case GrpcEvitaDataType.SHORT_NUMBER_RANGE:
                return Scalar.ShortNumberRange
            case GrpcEvitaDataType.SHORT_NUMBER_RANGE_ARRAY:
                return Scalar.ShortNumberRangeArray
            case GrpcEvitaDataType.STRING:
                return Scalar.String
            case GrpcEvitaDataType.STRING_ARRAY:
                return Scalar.StringArray
            case GrpcEvitaDataType.UUID:
                return Scalar.UUID
            case GrpcEvitaDataType.UUID_ARRAY:
                return Scalar.UUIDArray
            default:
                throw new UnexpectedError(`Unsupported scalar type '${scalar}'.`)
        }
    }
    public static convertAssociatedDataScalar(scalar: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType): Scalar {
        if (scalar == GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.COMPLEX_DATA_OBJECT) {
            return Scalar.ComplexDataObject
        }
        return this.convertScalar(scalar as unknown as GrpcEvitaDataType);
    }
}
