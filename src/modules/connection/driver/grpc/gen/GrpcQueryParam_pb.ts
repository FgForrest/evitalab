// @generated by protoc-gen-es v1.10.0 with parameter "target=ts"
// @generated from file GrpcQueryParam.proto (package io.evitadb.externalApi.grpc.generated, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { GrpcAttributeSpecialValueArray, GrpcBigDecimal, GrpcBigDecimalArray, GrpcBigDecimalNumberRange, GrpcBigDecimalNumberRangeArray, GrpcBooleanArray, GrpcCurrency, GrpcCurrencyArray, GrpcDateTimeRange, GrpcDateTimeRangeArray, GrpcEmptyHierarchicalEntityBehaviourArray, GrpcEntityScopeArray, GrpcFacetStatisticsDepthArray, GrpcHistogramBehaviorTypeArray, GrpcIntegerArray, GrpcIntegerNumberRange, GrpcIntegerNumberRangeArray, GrpcLocale, GrpcLocaleArray, GrpcLongArray, GrpcLongNumberRange, GrpcLongNumberRangeArray, GrpcOffsetDateTime, GrpcOffsetDateTimeArray, GrpcOrderDirectionArray, GrpcPriceContentModeArray, GrpcQueryPriceModeArray, GrpcStatisticsBaseArray, GrpcStatisticsTypeArray, GrpcStringArray } from "./GrpcEvitaDataTypes_pb.js";
import { GrpcAttributeSpecialValue, GrpcEmptyHierarchicalEntityBehaviour, GrpcEntityScope, GrpcFacetStatisticsDepth, GrpcHistogramBehavior, GrpcManagedReferencesBehaviour, GrpcOrderDirection, GrpcPriceContentMode, GrpcQueryPriceMode, GrpcStatisticsBase, GrpcStatisticsType } from "./GrpcEnums_pb.js";

/**
 * Structure that supports storing all possible parameters that could be used within query.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcQueryParam
 */
export class GrpcQueryParam extends Message<GrpcQueryParam> {
  /**
   * The value of the parameter.
   *
   * @generated from oneof io.evitadb.externalApi.grpc.generated.GrpcQueryParam.queryParam
   */
  queryParam: {
    /**
     * The string value.
     *
     * @generated from field: string stringValue = 1;
     */
    value: string;
    case: "stringValue";
  } | {
    /**
     * The integer value.
     *
     * @generated from field: int32 integerValue = 2;
     */
    value: number;
    case: "integerValue";
  } | {
    /**
     * The long value.
     *
     * @generated from field: int64 longValue = 3;
     */
    value: bigint;
    case: "longValue";
  } | {
    /**
     * The boolean value.
     *
     * @generated from field: bool booleanValue = 4;
     */
    value: boolean;
    case: "booleanValue";
  } | {
    /**
     * The big decimal value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcBigDecimal bigDecimalValue = 5;
     */
    value: GrpcBigDecimal;
    case: "bigDecimalValue";
  } | {
    /**
     * The date time range value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcDateTimeRange dateTimeRangeValue = 6;
     */
    value: GrpcDateTimeRange;
    case: "dateTimeRangeValue";
  } | {
    /**
     * The integer number range value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcIntegerNumberRange integerNumberRangeValue = 7;
     */
    value: GrpcIntegerNumberRange;
    case: "integerNumberRangeValue";
  } | {
    /**
     * The long number range value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcLongNumberRange longNumberRangeValue = 8;
     */
    value: GrpcLongNumberRange;
    case: "longNumberRangeValue";
  } | {
    /**
     * The big decimal number range value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcBigDecimalNumberRange bigDecimalNumberRangeValue = 9;
     */
    value: GrpcBigDecimalNumberRange;
    case: "bigDecimalNumberRangeValue";
  } | {
    /**
     * The offset date time value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcOffsetDateTime offsetDateTimeValue = 10;
     */
    value: GrpcOffsetDateTime;
    case: "offsetDateTimeValue";
  } | {
    /**
     * The locale value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcLocale localeValue = 11;
     */
    value: GrpcLocale;
    case: "localeValue";
  } | {
    /**
     * The currency value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCurrency currencyValue = 12;
     */
    value: GrpcCurrency;
    case: "currencyValue";
  } | {
    /**
     * The facet statistics depth enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcFacetStatisticsDepth facetStatisticsDepthValue = 13;
     */
    value: GrpcFacetStatisticsDepth;
    case: "facetStatisticsDepthValue";
  } | {
    /**
     * The query price mode enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcQueryPriceMode queryPriceModelValue = 14;
     */
    value: GrpcQueryPriceMode;
    case: "queryPriceModelValue";
  } | {
    /**
     * The price content mode enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcPriceContentMode priceContentModeValue = 15;
     */
    value: GrpcPriceContentMode;
    case: "priceContentModeValue";
  } | {
    /**
     * The attribute special value enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcAttributeSpecialValue attributeSpecialValue = 16;
     */
    value: GrpcAttributeSpecialValue;
    case: "attributeSpecialValue";
  } | {
    /**
     * The order direction enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcOrderDirection orderDirectionValue = 17;
     */
    value: GrpcOrderDirection;
    case: "orderDirectionValue";
  } | {
    /**
     * The empty hierarchical entity behaviour enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcEmptyHierarchicalEntityBehaviour emptyHierarchicalEntityBehaviour = 18;
     */
    value: GrpcEmptyHierarchicalEntityBehaviour;
    case: "emptyHierarchicalEntityBehaviour";
  } | {
    /**
     * The statistics base enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcStatisticsBase statisticsBase = 19;
     */
    value: GrpcStatisticsBase;
    case: "statisticsBase";
  } | {
    /**
     * The statistics type enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcStatisticsType statisticsType = 20;
     */
    value: GrpcStatisticsType;
    case: "statisticsType";
  } | {
    /**
     * The histogram behavior enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcHistogramBehavior histogramBehavior = 21;
     */
    value: GrpcHistogramBehavior;
    case: "histogramBehavior";
  } | {
    /**
     * The managed references behaviour
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcManagedReferencesBehaviour managedReferencesBehaviour = 22;
     */
    value: GrpcManagedReferencesBehaviour;
    case: "managedReferencesBehaviour";
  } | {
    /**
     * The expression
     *
     * @generated from field: string expressionValue = 23;
     */
    value: string;
    case: "expressionValue";
  } | {
    /**
     * The scope enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcEntityScope scope = 24;
     */
    value: GrpcEntityScope;
    case: "scope";
  } | {
    /**
     * The string array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcStringArray stringArrayValue = 101;
     */
    value: GrpcStringArray;
    case: "stringArrayValue";
  } | {
    /**
     * The integer array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcIntegerArray integerArrayValue = 102;
     */
    value: GrpcIntegerArray;
    case: "integerArrayValue";
  } | {
    /**
     * The long array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcLongArray longArrayValue = 103;
     */
    value: GrpcLongArray;
    case: "longArrayValue";
  } | {
    /**
     * The boolean array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcBooleanArray booleanArrayValue = 104;
     */
    value: GrpcBooleanArray;
    case: "booleanArrayValue";
  } | {
    /**
     * The big decimal array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcBigDecimalArray bigDecimalArrayValue = 105;
     */
    value: GrpcBigDecimalArray;
    case: "bigDecimalArrayValue";
  } | {
    /**
     * The date time range array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcDateTimeRangeArray dateTimeRangeArrayValue = 106;
     */
    value: GrpcDateTimeRangeArray;
    case: "dateTimeRangeArrayValue";
  } | {
    /**
     * The integer number range array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcIntegerNumberRangeArray integerNumberRangeArrayValue = 107;
     */
    value: GrpcIntegerNumberRangeArray;
    case: "integerNumberRangeArrayValue";
  } | {
    /**
     * The long number range array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcLongNumberRangeArray longNumberRangeArrayValue = 108;
     */
    value: GrpcLongNumberRangeArray;
    case: "longNumberRangeArrayValue";
  } | {
    /**
     * The big decimal number range array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcBigDecimalNumberRangeArray bigDecimalNumberRangeArrayValue = 109;
     */
    value: GrpcBigDecimalNumberRangeArray;
    case: "bigDecimalNumberRangeArrayValue";
  } | {
    /**
     * The offset date time array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcOffsetDateTimeArray offsetDateTimeArrayValue = 110;
     */
    value: GrpcOffsetDateTimeArray;
    case: "offsetDateTimeArrayValue";
  } | {
    /**
     * The locale array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcLocaleArray localeArrayValue = 111;
     */
    value: GrpcLocaleArray;
    case: "localeArrayValue";
  } | {
    /**
     * The currency array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCurrencyArray currencyArrayValue = 112;
     */
    value: GrpcCurrencyArray;
    case: "currencyArrayValue";
  } | {
    /**
     * The facet statistics depth array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcFacetStatisticsDepthArray facetStatisticsDepthArrayValue = 113;
     */
    value: GrpcFacetStatisticsDepthArray;
    case: "facetStatisticsDepthArrayValue";
  } | {
    /**
     * The query price mode array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcQueryPriceModeArray queryPriceModelArrayValue = 114;
     */
    value: GrpcQueryPriceModeArray;
    case: "queryPriceModelArrayValue";
  } | {
    /**
     * The price content mode array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcPriceContentModeArray priceContentModeArrayValue = 115;
     */
    value: GrpcPriceContentModeArray;
    case: "priceContentModeArrayValue";
  } | {
    /**
     * The attribute special value array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcAttributeSpecialValueArray attributeSpecialArrayValue = 116;
     */
    value: GrpcAttributeSpecialValueArray;
    case: "attributeSpecialArrayValue";
  } | {
    /**
     * The order direction array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcOrderDirectionArray orderDirectionArrayValue = 117;
     */
    value: GrpcOrderDirectionArray;
    case: "orderDirectionArrayValue";
  } | {
    /**
     * The empty hierarchical entity behaviour array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcEmptyHierarchicalEntityBehaviourArray emptyHierarchicalEntityBehaviourArrayValue = 118;
     */
    value: GrpcEmptyHierarchicalEntityBehaviourArray;
    case: "emptyHierarchicalEntityBehaviourArrayValue";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcStatisticsBaseArray statisticsBaseArrayValue = 119;
     */
    value: GrpcStatisticsBaseArray;
    case: "statisticsBaseArrayValue";
  } | {
    /**
     * The statistics type array value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcStatisticsTypeArray statisticsTypeArrayValue = 120;
     */
    value: GrpcStatisticsTypeArray;
    case: "statisticsTypeArrayValue";
  } | {
    /**
     * The histogram behavior enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcHistogramBehaviorTypeArray histogramBehaviorTypeArrayValue = 121;
     */
    value: GrpcHistogramBehaviorTypeArray;
    case: "histogramBehaviorTypeArrayValue";
  } | {
    /**
     * The scope enum value.
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcEntityScopeArray scopeArrayValue = 122;
     */
    value: GrpcEntityScopeArray;
    case: "scopeArrayValue";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<GrpcQueryParam>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcQueryParam";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "stringValue", kind: "scalar", T: 9 /* ScalarType.STRING */, oneof: "queryParam" },
    { no: 2, name: "integerValue", kind: "scalar", T: 5 /* ScalarType.INT32 */, oneof: "queryParam" },
    { no: 3, name: "longValue", kind: "scalar", T: 3 /* ScalarType.INT64 */, oneof: "queryParam" },
    { no: 4, name: "booleanValue", kind: "scalar", T: 8 /* ScalarType.BOOL */, oneof: "queryParam" },
    { no: 5, name: "bigDecimalValue", kind: "message", T: GrpcBigDecimal, oneof: "queryParam" },
    { no: 6, name: "dateTimeRangeValue", kind: "message", T: GrpcDateTimeRange, oneof: "queryParam" },
    { no: 7, name: "integerNumberRangeValue", kind: "message", T: GrpcIntegerNumberRange, oneof: "queryParam" },
    { no: 8, name: "longNumberRangeValue", kind: "message", T: GrpcLongNumberRange, oneof: "queryParam" },
    { no: 9, name: "bigDecimalNumberRangeValue", kind: "message", T: GrpcBigDecimalNumberRange, oneof: "queryParam" },
    { no: 10, name: "offsetDateTimeValue", kind: "message", T: GrpcOffsetDateTime, oneof: "queryParam" },
    { no: 11, name: "localeValue", kind: "message", T: GrpcLocale, oneof: "queryParam" },
    { no: 12, name: "currencyValue", kind: "message", T: GrpcCurrency, oneof: "queryParam" },
    { no: 13, name: "facetStatisticsDepthValue", kind: "enum", T: proto3.getEnumType(GrpcFacetStatisticsDepth), oneof: "queryParam" },
    { no: 14, name: "queryPriceModelValue", kind: "enum", T: proto3.getEnumType(GrpcQueryPriceMode), oneof: "queryParam" },
    { no: 15, name: "priceContentModeValue", kind: "enum", T: proto3.getEnumType(GrpcPriceContentMode), oneof: "queryParam" },
    { no: 16, name: "attributeSpecialValue", kind: "enum", T: proto3.getEnumType(GrpcAttributeSpecialValue), oneof: "queryParam" },
    { no: 17, name: "orderDirectionValue", kind: "enum", T: proto3.getEnumType(GrpcOrderDirection), oneof: "queryParam" },
    { no: 18, name: "emptyHierarchicalEntityBehaviour", kind: "enum", T: proto3.getEnumType(GrpcEmptyHierarchicalEntityBehaviour), oneof: "queryParam" },
    { no: 19, name: "statisticsBase", kind: "enum", T: proto3.getEnumType(GrpcStatisticsBase), oneof: "queryParam" },
    { no: 20, name: "statisticsType", kind: "enum", T: proto3.getEnumType(GrpcStatisticsType), oneof: "queryParam" },
    { no: 21, name: "histogramBehavior", kind: "enum", T: proto3.getEnumType(GrpcHistogramBehavior), oneof: "queryParam" },
    { no: 22, name: "managedReferencesBehaviour", kind: "enum", T: proto3.getEnumType(GrpcManagedReferencesBehaviour), oneof: "queryParam" },
    { no: 23, name: "expressionValue", kind: "scalar", T: 9 /* ScalarType.STRING */, oneof: "queryParam" },
    { no: 24, name: "scope", kind: "enum", T: proto3.getEnumType(GrpcEntityScope), oneof: "queryParam" },
    { no: 101, name: "stringArrayValue", kind: "message", T: GrpcStringArray, oneof: "queryParam" },
    { no: 102, name: "integerArrayValue", kind: "message", T: GrpcIntegerArray, oneof: "queryParam" },
    { no: 103, name: "longArrayValue", kind: "message", T: GrpcLongArray, oneof: "queryParam" },
    { no: 104, name: "booleanArrayValue", kind: "message", T: GrpcBooleanArray, oneof: "queryParam" },
    { no: 105, name: "bigDecimalArrayValue", kind: "message", T: GrpcBigDecimalArray, oneof: "queryParam" },
    { no: 106, name: "dateTimeRangeArrayValue", kind: "message", T: GrpcDateTimeRangeArray, oneof: "queryParam" },
    { no: 107, name: "integerNumberRangeArrayValue", kind: "message", T: GrpcIntegerNumberRangeArray, oneof: "queryParam" },
    { no: 108, name: "longNumberRangeArrayValue", kind: "message", T: GrpcLongNumberRangeArray, oneof: "queryParam" },
    { no: 109, name: "bigDecimalNumberRangeArrayValue", kind: "message", T: GrpcBigDecimalNumberRangeArray, oneof: "queryParam" },
    { no: 110, name: "offsetDateTimeArrayValue", kind: "message", T: GrpcOffsetDateTimeArray, oneof: "queryParam" },
    { no: 111, name: "localeArrayValue", kind: "message", T: GrpcLocaleArray, oneof: "queryParam" },
    { no: 112, name: "currencyArrayValue", kind: "message", T: GrpcCurrencyArray, oneof: "queryParam" },
    { no: 113, name: "facetStatisticsDepthArrayValue", kind: "message", T: GrpcFacetStatisticsDepthArray, oneof: "queryParam" },
    { no: 114, name: "queryPriceModelArrayValue", kind: "message", T: GrpcQueryPriceModeArray, oneof: "queryParam" },
    { no: 115, name: "priceContentModeArrayValue", kind: "message", T: GrpcPriceContentModeArray, oneof: "queryParam" },
    { no: 116, name: "attributeSpecialArrayValue", kind: "message", T: GrpcAttributeSpecialValueArray, oneof: "queryParam" },
    { no: 117, name: "orderDirectionArrayValue", kind: "message", T: GrpcOrderDirectionArray, oneof: "queryParam" },
    { no: 118, name: "emptyHierarchicalEntityBehaviourArrayValue", kind: "message", T: GrpcEmptyHierarchicalEntityBehaviourArray, oneof: "queryParam" },
    { no: 119, name: "statisticsBaseArrayValue", kind: "message", T: GrpcStatisticsBaseArray, oneof: "queryParam" },
    { no: 120, name: "statisticsTypeArrayValue", kind: "message", T: GrpcStatisticsTypeArray, oneof: "queryParam" },
    { no: 121, name: "histogramBehaviorTypeArrayValue", kind: "message", T: GrpcHistogramBehaviorTypeArray, oneof: "queryParam" },
    { no: 122, name: "scopeArrayValue", kind: "message", T: GrpcEntityScopeArray, oneof: "queryParam" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcQueryParam {
    return new GrpcQueryParam().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcQueryParam {
    return new GrpcQueryParam().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcQueryParam {
    return new GrpcQueryParam().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcQueryParam | PlainMessage<GrpcQueryParam> | undefined, b: GrpcQueryParam | PlainMessage<GrpcQueryParam> | undefined): boolean {
    return proto3.util.equals(GrpcQueryParam, a, b);
  }
}

