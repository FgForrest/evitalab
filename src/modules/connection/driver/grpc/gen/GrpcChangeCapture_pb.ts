// @generated by protoc-gen-es v1.10.0 with parameter "target=ts"
// @generated from file GrpcChangeCapture.proto (package io.evitadb.externalApi.grpc.generated, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Int32Value, Message, proto3, protoInt64, StringValue } from "@bufbuild/protobuf";
import { GrpcEntitySchemaMutation } from "./GrpcEntitySchemaMutation_pb.js";
import { GrpcEntityMutation } from "./GrpcEntityMutation_pb.js";
import { GrpcLocalMutation } from "./GrpcLocalMutation_pb.js";

/**
 * The enum defines what catalog area is covered by the capture.
 *
 * @generated from enum io.evitadb.externalApi.grpc.generated.GrpcCaptureArea
 */
export enum GrpcCaptureArea {
  /**
   * Changes in the schema are captured.
   *
   * @generated from enum value: SCHEMA = 0;
   */
  SCHEMA = 0,

  /**
   * Changes in the data are captured.
   *
   * @generated from enum value: DATA = 1;
   */
  DATA = 1,

  /**
   * Infrastructural mutations that are neither schema nor data.
   *
   * @generated from enum value: INFRASTRUCTURE = 2;
   */
  INFRASTRUCTURE = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(GrpcCaptureArea)
proto3.util.setEnumType(GrpcCaptureArea, "io.evitadb.externalApi.grpc.generated.GrpcCaptureArea", [
  { no: 0, name: "SCHEMA" },
  { no: 1, name: "DATA" },
  { no: 2, name: "INFRASTRUCTURE" },
]);

/**
 * Enumeration of possible mutation types handled by evitaDB.
 *
 * @generated from enum io.evitadb.externalApi.grpc.generated.GrpcCaptureOperation
 */
export enum GrpcCaptureOperation {
  /**
   * Create or update operation - i.e. there was data with such identity before, and it was updated.
   *
   * @generated from enum value: UPSERT = 0;
   */
  UPSERT = 0,

  /**
   * Remove operation - i.e. there was data with such identity before, and it was removed.
   *
   * @generated from enum value: REMOVE = 1;
   */
  REMOVE = 1,

  /**
   * Delimiting operation signaling the beginning of a transaction.
   *
   * @generated from enum value: TRANSACTION = 2;
   */
  TRANSACTION = 2,
}
// Retrieve enum metadata with: proto3.getEnumType(GrpcCaptureOperation)
proto3.util.setEnumType(GrpcCaptureOperation, "io.evitadb.externalApi.grpc.generated.GrpcCaptureOperation", [
  { no: 0, name: "UPSERT" },
  { no: 1, name: "REMOVE" },
  { no: 2, name: "TRANSACTION" },
]);

/**
 * The container type describes internal evitaDB data structures.
 *
 * @generated from enum io.evitadb.externalApi.grpc.generated.GrpcCaptureContainerType
 */
export enum GrpcCaptureContainerType {
  /**
   * Catalog - similar to relational database schema.
   *
   * @generated from enum value: CONTAINER_CATALOG = 0;
   */
  CONTAINER_CATALOG = 0,

  /**
   * Entity - similar to relational database table (or better - set of inter-related tables).
   *
   * @generated from enum value: CONTAINER_ENTITY = 1;
   */
  CONTAINER_ENTITY = 1,

  /**
   * Attribute - similar to relational database column.
   *
   * @generated from enum value: CONTAINER_ATTRIBUTE = 2;
   */
  CONTAINER_ATTRIBUTE = 2,

  /**
   * Reference - similar to an unstructured JSON document in relational database column.
   *
   * @generated from enum value: CONTAINER_ASSOCIATED_DATA = 3;
   */
  CONTAINER_ASSOCIATED_DATA = 3,

  /**
   * Price - fixed structure data type, could be represented as row in a specialized table in relational database.
   *
   * @generated from enum value: CONTAINER_PRICE = 4;
   */
  CONTAINER_PRICE = 4,

  /**
   * Reference - similar to a foreign key in relational database or a binding table in many-to-many relationship.
   *
   * @generated from enum value: CONTAINER_REFERENCE = 5;
   */
  CONTAINER_REFERENCE = 5,
}
// Retrieve enum metadata with: proto3.getEnumType(GrpcCaptureContainerType)
proto3.util.setEnumType(GrpcCaptureContainerType, "io.evitadb.externalApi.grpc.generated.GrpcCaptureContainerType", [
  { no: 0, name: "CONTAINER_CATALOG" },
  { no: 1, name: "CONTAINER_ENTITY" },
  { no: 2, name: "CONTAINER_ATTRIBUTE" },
  { no: 3, name: "CONTAINER_ASSOCIATED_DATA" },
  { no: 4, name: "CONTAINER_PRICE" },
  { no: 5, name: "CONTAINER_REFERENCE" },
]);

/**
 * Enum to specify the depth of details sent in the CDC event.
 *
 * @generated from enum io.evitadb.externalApi.grpc.generated.GrpcCaptureContent
 */
export enum GrpcCaptureContent {
  /**
   * Only the header of the event is sent.
   *
   * @generated from enum value: HEADER = 0;
   */
  HEADER = 0,

  /**
   * Entire mutation triggering the event is sent. In case of mutations with the large content (associated data
   * update), the size of the event can be significant. Consider whether you need the entire mutation or just the
   * header.
   *
   * @generated from enum value: BODY = 1;
   */
  BODY = 1,
}
// Retrieve enum metadata with: proto3.getEnumType(GrpcCaptureContent)
proto3.util.setEnumType(GrpcCaptureContent, "io.evitadb.externalApi.grpc.generated.GrpcCaptureContent", [
  { no: 0, name: "HEADER" },
  { no: 1, name: "BODY" },
]);

/**
 * Record for the criteria of the capture request allowing to limit mutations to specific area of interest an its
 * properties.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcCaptureCriteria
 */
export class GrpcCaptureCriteria extends Message<GrpcCaptureCriteria> {
  /**
   * The area of capture - either schema or data (correlates with the site)
   *
   * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCaptureArea area = 1;
   */
  area = GrpcCaptureArea.SCHEMA;

  /**
   * The specific requirements for the designated area
   *
   * @generated from oneof io.evitadb.externalApi.grpc.generated.GrpcCaptureCriteria.site
   */
  site: {
    /**
     * Criteria for schema capture
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCaptureSchemaSite schemaSite = 2;
     */
    value: GrpcCaptureSchemaSite;
    case: "schemaSite";
  } | {
    /**
     * Criteria for data capture
     *
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCaptureDataSite dataSite = 3;
     */
    value: GrpcCaptureDataSite;
    case: "dataSite";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<GrpcCaptureCriteria>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcCaptureCriteria";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "area", kind: "enum", T: proto3.getEnumType(GrpcCaptureArea) },
    { no: 2, name: "schemaSite", kind: "message", T: GrpcCaptureSchemaSite, oneof: "site" },
    { no: 3, name: "dataSite", kind: "message", T: GrpcCaptureDataSite, oneof: "site" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcCaptureCriteria {
    return new GrpcCaptureCriteria().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcCaptureCriteria {
    return new GrpcCaptureCriteria().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcCaptureCriteria {
    return new GrpcCaptureCriteria().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcCaptureCriteria | PlainMessage<GrpcCaptureCriteria> | undefined, b: GrpcCaptureCriteria | PlainMessage<GrpcCaptureCriteria> | undefined): boolean {
    return proto3.util.equals(GrpcCaptureCriteria, a, b);
  }
}

/**
 * Record describing the location and form of the CDC schema event in the evitaDB that should be captured.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcCaptureSchemaSite
 */
export class GrpcCaptureSchemaSite extends Message<GrpcCaptureSchemaSite> {
  /**
   * The name of intercepted entity
   *
   * @generated from field: google.protobuf.StringValue entityType = 1;
   */
  entityType?: string;

  /**
   * The intercepted type of operation
   *
   * @generated from field: repeated io.evitadb.externalApi.grpc.generated.GrpcCaptureOperation operation = 2;
   */
  operation: GrpcCaptureOperation[] = [];

  /**
   * the name of the intercepted container type
   *
   * @generated from field: repeated io.evitadb.externalApi.grpc.generated.GrpcCaptureContainerType containerType = 3;
   */
  containerType: GrpcCaptureContainerType[] = [];

  constructor(data?: PartialMessage<GrpcCaptureSchemaSite>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcCaptureSchemaSite";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "entityType", kind: "message", T: StringValue },
    { no: 2, name: "operation", kind: "enum", T: proto3.getEnumType(GrpcCaptureOperation), repeated: true },
    { no: 3, name: "containerType", kind: "enum", T: proto3.getEnumType(GrpcCaptureContainerType), repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcCaptureSchemaSite {
    return new GrpcCaptureSchemaSite().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcCaptureSchemaSite {
    return new GrpcCaptureSchemaSite().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcCaptureSchemaSite {
    return new GrpcCaptureSchemaSite().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcCaptureSchemaSite | PlainMessage<GrpcCaptureSchemaSite> | undefined, b: GrpcCaptureSchemaSite | PlainMessage<GrpcCaptureSchemaSite> | undefined): boolean {
    return proto3.util.equals(GrpcCaptureSchemaSite, a, b);
  }
}

/**
 * Record describing the location and form of the CDC data event in the evitaDB that should be captured.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcCaptureDataSite
 */
export class GrpcCaptureDataSite extends Message<GrpcCaptureDataSite> {
  /**
   * the name of the intercepted entity type
   *
   * @generated from field: google.protobuf.StringValue entityType = 1;
   */
  entityType?: string;

  /**
   * the primary key of the intercepted entity
   *
   * @generated from field: google.protobuf.Int32Value entityPrimaryKey = 2;
   */
  entityPrimaryKey?: number;

  /**
   * the intercepted type of operation
   *
   * @generated from field: repeated io.evitadb.externalApi.grpc.generated.GrpcCaptureOperation operation = 3;
   */
  operation: GrpcCaptureOperation[] = [];

  /**
   * the name of the intercepted container type
   *
   * @generated from field: repeated io.evitadb.externalApi.grpc.generated.GrpcCaptureContainerType containerType = 4;
   */
  containerType: GrpcCaptureContainerType[] = [];

  /**
   * the name of the container (e.g. attribute name, associated data name, reference name)
   *
   * @generated from field: repeated string containerName = 5;
   */
  containerName: string[] = [];

  constructor(data?: PartialMessage<GrpcCaptureDataSite>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcCaptureDataSite";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "entityType", kind: "message", T: StringValue },
    { no: 2, name: "entityPrimaryKey", kind: "message", T: Int32Value },
    { no: 3, name: "operation", kind: "enum", T: proto3.getEnumType(GrpcCaptureOperation), repeated: true },
    { no: 4, name: "containerType", kind: "enum", T: proto3.getEnumType(GrpcCaptureContainerType), repeated: true },
    { no: 5, name: "containerName", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcCaptureDataSite {
    return new GrpcCaptureDataSite().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcCaptureDataSite {
    return new GrpcCaptureDataSite().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcCaptureDataSite {
    return new GrpcCaptureDataSite().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcCaptureDataSite | PlainMessage<GrpcCaptureDataSite> | undefined, b: GrpcCaptureDataSite | PlainMessage<GrpcCaptureDataSite> | undefined): boolean {
    return proto3.util.equals(GrpcCaptureDataSite, a, b);
  }
}

/**
 * Record represents a CDC event that is sent to the subscriber if it matches to the request he made.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcChangeCatalogCapture
 */
export class GrpcChangeCatalogCapture extends Message<GrpcChangeCatalogCapture> {
  /**
   * the version of the catalog where the operation was performed
   *
   * @generated from field: int64 version = 1;
   */
  version = protoInt64.zero;

  /**
   * the index of the event within the enclosed transaction, index 0 is the transaction lead event
   *
   * @generated from field: int32 index = 2;
   */
  index = 0;

  /**
   * the area of the operation
   *
   * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCaptureArea area = 3;
   */
  area = GrpcCaptureArea.SCHEMA;

  /**
   * the name of the entity type or its schema that was affected by the operation
   * (if the operation is executed on catalog schema this field is null)
   *
   * @generated from field: google.protobuf.StringValue entityType = 4;
   */
  entityType?: string;

  /**
   * the operation that was performed
   *
   * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCaptureOperation operation = 5;
   */
  operation = GrpcCaptureOperation.UPSERT;

  /**
   * optional body of the operation when it is requested by the GrpcContent
   *
   * @generated from oneof io.evitadb.externalApi.grpc.generated.GrpcChangeCatalogCapture.body
   */
  body: {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcEntitySchemaMutation schemaMutation = 6;
     */
    value: GrpcEntitySchemaMutation;
    case: "schemaMutation";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcEntityMutation entityMutation = 7;
     */
    value: GrpcEntityMutation;
    case: "entityMutation";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcLocalMutation localMutation = 8;
     */
    value: GrpcLocalMutation;
    case: "localMutation";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<GrpcChangeCatalogCapture>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcChangeCatalogCapture";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "version", kind: "scalar", T: 3 /* ScalarType.INT64 */ },
    { no: 2, name: "index", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 3, name: "area", kind: "enum", T: proto3.getEnumType(GrpcCaptureArea) },
    { no: 4, name: "entityType", kind: "message", T: StringValue },
    { no: 5, name: "operation", kind: "enum", T: proto3.getEnumType(GrpcCaptureOperation) },
    { no: 6, name: "schemaMutation", kind: "message", T: GrpcEntitySchemaMutation, oneof: "body" },
    { no: 7, name: "entityMutation", kind: "message", T: GrpcEntityMutation, oneof: "body" },
    { no: 8, name: "localMutation", kind: "message", T: GrpcLocalMutation, oneof: "body" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcChangeCatalogCapture {
    return new GrpcChangeCatalogCapture().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcChangeCatalogCapture {
    return new GrpcChangeCatalogCapture().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcChangeCatalogCapture {
    return new GrpcChangeCatalogCapture().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcChangeCatalogCapture | PlainMessage<GrpcChangeCatalogCapture> | undefined, b: GrpcChangeCatalogCapture | PlainMessage<GrpcChangeCatalogCapture> | undefined): boolean {
    return proto3.util.equals(GrpcChangeCatalogCapture, a, b);
  }
}

