// @generated by protoc-gen-es v1.10.0 with parameter "target=ts"
// @generated from file GrpcSortableAttributeCompoundSchemaMutations.proto (package io.evitadb.externalApi.grpc.generated, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, StringValue } from "@bufbuild/protobuf";
import { GrpcAttributeElement } from "./GrpcEntitySchema_pb.js";
import { GrpcEntityScope } from "./GrpcEnums_pb.js";

/**
 * Mutation is responsible for setting up a new `SortableAttributeCompoundSchema` in the `EntitySchema`.
 * Mutation can be used for altering also the existing `SortableAttributeCompoundSchema` alone.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcCreateSortableAttributeCompoundSchemaMutation
 */
export class GrpcCreateSortableAttributeCompoundSchemaMutation extends Message<GrpcCreateSortableAttributeCompoundSchemaMutation> {
  /**
   * Name of the sortable attribute compound the mutation is targeting.
   *
   * @generated from field: string name = 1;
   */
  name = "";

  /**
   * Contains description of the model is optional but helps authors of the schema / client API to better
   * explain the original purpose of the model to the consumers.
   *
   * @generated from field: google.protobuf.StringValue description = 2;
   */
  description?: string;

  /**
   * Deprecation notice contains information about planned removal of this sortable attribute compound from
   * the model / client API.
   * This allows to plan and evolve the schema allowing clients to adapt early to planned breaking changes.
   *
   * @generated from field: google.protobuf.StringValue deprecationNotice = 3;
   */
  deprecationNotice?: string;

  /**
   * Defines list of individual elements forming this compound.
   *
   * @generated from field: repeated io.evitadb.externalApi.grpc.generated.GrpcAttributeElement attributeElements = 4;
   */
  attributeElements: GrpcAttributeElement[] = [];

  /**
   * When attribute sortable compound is indexed, it is possible to sort entities by this calculated attribute compound.
   * This property contains set of all scopes this attribute compound is indexed in.
   *
   * @generated from field: repeated io.evitadb.externalApi.grpc.generated.GrpcEntityScope indexedInScopes = 5;
   */
  indexedInScopes: GrpcEntityScope[] = [];

  constructor(data?: PartialMessage<GrpcCreateSortableAttributeCompoundSchemaMutation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcCreateSortableAttributeCompoundSchemaMutation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "description", kind: "message", T: StringValue },
    { no: 3, name: "deprecationNotice", kind: "message", T: StringValue },
    { no: 4, name: "attributeElements", kind: "message", T: GrpcAttributeElement, repeated: true },
    { no: 5, name: "indexedInScopes", kind: "enum", T: proto3.getEnumType(GrpcEntityScope), repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcCreateSortableAttributeCompoundSchemaMutation {
    return new GrpcCreateSortableAttributeCompoundSchemaMutation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcCreateSortableAttributeCompoundSchemaMutation {
    return new GrpcCreateSortableAttributeCompoundSchemaMutation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcCreateSortableAttributeCompoundSchemaMutation {
    return new GrpcCreateSortableAttributeCompoundSchemaMutation().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcCreateSortableAttributeCompoundSchemaMutation | PlainMessage<GrpcCreateSortableAttributeCompoundSchemaMutation> | undefined, b: GrpcCreateSortableAttributeCompoundSchemaMutation | PlainMessage<GrpcCreateSortableAttributeCompoundSchemaMutation> | undefined): boolean {
    return proto3.util.equals(GrpcCreateSortableAttributeCompoundSchemaMutation, a, b);
  }
}

/**
 * Mutation is responsible for setting value to a `SortableAttributeCompoundSchema.deprecationNotice` in `EntitySchema`
 * or `ReferenceSchema`.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation
 */
export class GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation extends Message<GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation> {
  /**
   * Name of the sortable attribute compound the mutation is targeting.
   *
   * @generated from field: string name = 1;
   */
  name = "";

  /**
   * Deprecation notice contains information about planned removal of this sortable attribute compound from
   * the model / client API.
   * This allows to plan and evolve the schema allowing clients to adapt early to planned breaking changes.
   *
   * @generated from field: google.protobuf.StringValue deprecationNotice = 2;
   */
  deprecationNotice?: string;

  constructor(data?: PartialMessage<GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "deprecationNotice", kind: "message", T: StringValue },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation {
    return new GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation {
    return new GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation {
    return new GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation | PlainMessage<GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation> | undefined, b: GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation | PlainMessage<GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation> | undefined): boolean {
    return proto3.util.equals(GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation, a, b);
  }
}

/**
 * Mutation is responsible for setting value to a `SortableAttributeCompoundSchema.description` in `EntitySchema` or
 * `ReferenceSchema`.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaDescriptionMutation
 */
export class GrpcModifySortableAttributeCompoundSchemaDescriptionMutation extends Message<GrpcModifySortableAttributeCompoundSchemaDescriptionMutation> {
  /**
   * Name of the sortable attribute compound the mutation is targeting.
   *
   * @generated from field: string name = 1;
   */
  name = "";

  /**
   * Contains description of the model is optional but helps authors of the schema / client API to better
   * explain the original purpose of the model to the consumers.
   *
   * @generated from field: google.protobuf.StringValue description = 2;
   */
  description?: string;

  constructor(data?: PartialMessage<GrpcModifySortableAttributeCompoundSchemaDescriptionMutation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaDescriptionMutation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "description", kind: "message", T: StringValue },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcModifySortableAttributeCompoundSchemaDescriptionMutation {
    return new GrpcModifySortableAttributeCompoundSchemaDescriptionMutation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcModifySortableAttributeCompoundSchemaDescriptionMutation {
    return new GrpcModifySortableAttributeCompoundSchemaDescriptionMutation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcModifySortableAttributeCompoundSchemaDescriptionMutation {
    return new GrpcModifySortableAttributeCompoundSchemaDescriptionMutation().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcModifySortableAttributeCompoundSchemaDescriptionMutation | PlainMessage<GrpcModifySortableAttributeCompoundSchemaDescriptionMutation> | undefined, b: GrpcModifySortableAttributeCompoundSchemaDescriptionMutation | PlainMessage<GrpcModifySortableAttributeCompoundSchemaDescriptionMutation> | undefined): boolean {
    return proto3.util.equals(GrpcModifySortableAttributeCompoundSchemaDescriptionMutation, a, b);
  }
}

/**
 * Mutation is responsible for renaming an existing `SortableAttributeCompoundSchema` in `EntitySchema` or `ReferenceSchema`.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaNameMutation
 */
export class GrpcModifySortableAttributeCompoundSchemaNameMutation extends Message<GrpcModifySortableAttributeCompoundSchemaNameMutation> {
  /**
   * Name of the sortable attribute compound the mutation is targeting.
   *
   * @generated from field: string name = 1;
   */
  name = "";

  /**
   * New name of the sortable attribute compound the mutation is targeting.
   *
   * @generated from field: string newName = 2;
   */
  newName = "";

  constructor(data?: PartialMessage<GrpcModifySortableAttributeCompoundSchemaNameMutation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaNameMutation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "newName", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcModifySortableAttributeCompoundSchemaNameMutation {
    return new GrpcModifySortableAttributeCompoundSchemaNameMutation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcModifySortableAttributeCompoundSchemaNameMutation {
    return new GrpcModifySortableAttributeCompoundSchemaNameMutation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcModifySortableAttributeCompoundSchemaNameMutation {
    return new GrpcModifySortableAttributeCompoundSchemaNameMutation().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcModifySortableAttributeCompoundSchemaNameMutation | PlainMessage<GrpcModifySortableAttributeCompoundSchemaNameMutation> | undefined, b: GrpcModifySortableAttributeCompoundSchemaNameMutation | PlainMessage<GrpcModifySortableAttributeCompoundSchemaNameMutation> | undefined): boolean {
    return proto3.util.equals(GrpcModifySortableAttributeCompoundSchemaNameMutation, a, b);
  }
}

/**
 * Mutation is responsible for setting set of scopes for indexing value in a `SortableAttributeCompoundSchema` in `EntitySchema`.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcSetSortableAttributeCompoundIndexedMutation
 */
export class GrpcSetSortableAttributeCompoundIndexedMutation extends Message<GrpcSetSortableAttributeCompoundIndexedMutation> {
  /**
   * Name of the sortable attribute compound the mutation is targeting.
   *
   * @generated from field: string name = 1;
   */
  name = "";

  /**
   * When attribute sortable compound is indexed, it is possible to sort entities by this calculated attribute compound.
   * This property contains set of all scopes this attribute compound is indexed in.
   *
   * @generated from field: repeated io.evitadb.externalApi.grpc.generated.GrpcEntityScope indexedInScopes = 2;
   */
  indexedInScopes: GrpcEntityScope[] = [];

  constructor(data?: PartialMessage<GrpcSetSortableAttributeCompoundIndexedMutation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcSetSortableAttributeCompoundIndexedMutation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "indexedInScopes", kind: "enum", T: proto3.getEnumType(GrpcEntityScope), repeated: true },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcSetSortableAttributeCompoundIndexedMutation {
    return new GrpcSetSortableAttributeCompoundIndexedMutation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcSetSortableAttributeCompoundIndexedMutation {
    return new GrpcSetSortableAttributeCompoundIndexedMutation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcSetSortableAttributeCompoundIndexedMutation {
    return new GrpcSetSortableAttributeCompoundIndexedMutation().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcSetSortableAttributeCompoundIndexedMutation | PlainMessage<GrpcSetSortableAttributeCompoundIndexedMutation> | undefined, b: GrpcSetSortableAttributeCompoundIndexedMutation | PlainMessage<GrpcSetSortableAttributeCompoundIndexedMutation> | undefined): boolean {
    return proto3.util.equals(GrpcSetSortableAttributeCompoundIndexedMutation, a, b);
  }
}

/**
 * Mutation is responsible for removing an existing `SortableAttributeCompound` in the `EntitySchema` or `ReferenceSchema`.
 *
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcRemoveSortableAttributeCompoundSchemaMutation
 */
export class GrpcRemoveSortableAttributeCompoundSchemaMutation extends Message<GrpcRemoveSortableAttributeCompoundSchemaMutation> {
  /**
   * Name of the sortable attribute compound the mutation is targeting.
   *
   * @generated from field: string name = 1;
   */
  name = "";

  constructor(data?: PartialMessage<GrpcRemoveSortableAttributeCompoundSchemaMutation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcRemoveSortableAttributeCompoundSchemaMutation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcRemoveSortableAttributeCompoundSchemaMutation {
    return new GrpcRemoveSortableAttributeCompoundSchemaMutation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcRemoveSortableAttributeCompoundSchemaMutation {
    return new GrpcRemoveSortableAttributeCompoundSchemaMutation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcRemoveSortableAttributeCompoundSchemaMutation {
    return new GrpcRemoveSortableAttributeCompoundSchemaMutation().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcRemoveSortableAttributeCompoundSchemaMutation | PlainMessage<GrpcRemoveSortableAttributeCompoundSchemaMutation> | undefined, b: GrpcRemoveSortableAttributeCompoundSchemaMutation | PlainMessage<GrpcRemoveSortableAttributeCompoundSchemaMutation> | undefined): boolean {
    return proto3.util.equals(GrpcRemoveSortableAttributeCompoundSchemaMutation, a, b);
  }
}

/**
 * @generated from message io.evitadb.externalApi.grpc.generated.GrpcSortableAttributeCompoundSchemaMutation
 */
export class GrpcSortableAttributeCompoundSchemaMutation extends Message<GrpcSortableAttributeCompoundSchemaMutation> {
  /**
   * @generated from oneof io.evitadb.externalApi.grpc.generated.GrpcSortableAttributeCompoundSchemaMutation.mutation
   */
  mutation: {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcCreateSortableAttributeCompoundSchemaMutation createSortableAttributeCompoundSchemaMutation = 1;
     */
    value: GrpcCreateSortableAttributeCompoundSchemaMutation;
    case: "createSortableAttributeCompoundSchemaMutation";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation modifySortableAttributeCompoundSchemaDeprecationNoticeMutation = 2;
     */
    value: GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation;
    case: "modifySortableAttributeCompoundSchemaDeprecationNoticeMutation";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaDescriptionMutation modifySortableAttributeCompoundSchemaDescriptionMutation = 3;
     */
    value: GrpcModifySortableAttributeCompoundSchemaDescriptionMutation;
    case: "modifySortableAttributeCompoundSchemaDescriptionMutation";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcModifySortableAttributeCompoundSchemaNameMutation modifySortableAttributeCompoundSchemaNameMutation = 4;
     */
    value: GrpcModifySortableAttributeCompoundSchemaNameMutation;
    case: "modifySortableAttributeCompoundSchemaNameMutation";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcRemoveSortableAttributeCompoundSchemaMutation removeSortableAttributeCompoundSchemaMutation = 5;
     */
    value: GrpcRemoveSortableAttributeCompoundSchemaMutation;
    case: "removeSortableAttributeCompoundSchemaMutation";
  } | {
    /**
     * @generated from field: io.evitadb.externalApi.grpc.generated.GrpcSetSortableAttributeCompoundIndexedMutation setSortableAttributeCompoundIndexedMutation = 6;
     */
    value: GrpcSetSortableAttributeCompoundIndexedMutation;
    case: "setSortableAttributeCompoundIndexedMutation";
  } | { case: undefined; value?: undefined } = { case: undefined };

  constructor(data?: PartialMessage<GrpcSortableAttributeCompoundSchemaMutation>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "io.evitadb.externalApi.grpc.generated.GrpcSortableAttributeCompoundSchemaMutation";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "createSortableAttributeCompoundSchemaMutation", kind: "message", T: GrpcCreateSortableAttributeCompoundSchemaMutation, oneof: "mutation" },
    { no: 2, name: "modifySortableAttributeCompoundSchemaDeprecationNoticeMutation", kind: "message", T: GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation, oneof: "mutation" },
    { no: 3, name: "modifySortableAttributeCompoundSchemaDescriptionMutation", kind: "message", T: GrpcModifySortableAttributeCompoundSchemaDescriptionMutation, oneof: "mutation" },
    { no: 4, name: "modifySortableAttributeCompoundSchemaNameMutation", kind: "message", T: GrpcModifySortableAttributeCompoundSchemaNameMutation, oneof: "mutation" },
    { no: 5, name: "removeSortableAttributeCompoundSchemaMutation", kind: "message", T: GrpcRemoveSortableAttributeCompoundSchemaMutation, oneof: "mutation" },
    { no: 6, name: "setSortableAttributeCompoundIndexedMutation", kind: "message", T: GrpcSetSortableAttributeCompoundIndexedMutation, oneof: "mutation" },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GrpcSortableAttributeCompoundSchemaMutation {
    return new GrpcSortableAttributeCompoundSchemaMutation().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GrpcSortableAttributeCompoundSchemaMutation {
    return new GrpcSortableAttributeCompoundSchemaMutation().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GrpcSortableAttributeCompoundSchemaMutation {
    return new GrpcSortableAttributeCompoundSchemaMutation().fromJsonString(jsonString, options);
  }

  static equals(a: GrpcSortableAttributeCompoundSchemaMutation | PlainMessage<GrpcSortableAttributeCompoundSchemaMutation> | undefined, b: GrpcSortableAttributeCompoundSchemaMutation | PlainMessage<GrpcSortableAttributeCompoundSchemaMutation> | undefined): boolean {
    return proto3.util.equals(GrpcSortableAttributeCompoundSchemaMutation, a, b);
  }
}

