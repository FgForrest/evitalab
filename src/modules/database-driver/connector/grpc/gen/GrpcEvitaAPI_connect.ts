// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=ts"
// @generated from file GrpcEvitaAPI.proto (package io.evitadb.externalApi.grpc.generated, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { Empty, MethodKind } from "@bufbuild/protobuf";
import { GrpcCatalogNamesResponse, GrpcDefineCatalogRequest, GrpcDefineCatalogResponse, GrpcDeleteCatalogIfExistsRequest, GrpcDeleteCatalogIfExistsResponse, GrpcEvitaSessionRequest, GrpcEvitaSessionResponse, GrpcEvitaSessionTerminationRequest, GrpcEvitaSessionTerminationResponse, GrpcGetCatalogStateRequest, GrpcGetCatalogStateResponse, GrpcReadyResponse, GrpcRenameCatalogRequest, GrpcRenameCatalogResponse, GrpcReplaceCatalogRequest, GrpcReplaceCatalogResponse, GrpcUpdateEvitaRequest } from "./GrpcEvitaAPI_pb.js";

/**
 * This service contains RPCs that could be called by gRPC clients on evitaDB. Main purpose of this service is to provide
 * a way to create sessions and catalogs, and to update the catalog.
 *
 * @generated from service io.evitadb.externalApi.grpc.generated.EvitaService
 */
export const EvitaService = {
  typeName: "io.evitadb.externalApi.grpc.generated.EvitaService",
  methods: {
    /**
     * Procedure used to check readiness of the API
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.IsReady
     */
    isReady: {
      name: "IsReady",
      I: Empty,
      O: GrpcReadyResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to create read only sessions.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.CreateReadOnlySession
     */
    createReadOnlySession: {
      name: "CreateReadOnlySession",
      I: GrpcEvitaSessionRequest,
      O: GrpcEvitaSessionResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to create read write sessions.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.CreateReadWriteSession
     */
    createReadWriteSession: {
      name: "CreateReadWriteSession",
      I: GrpcEvitaSessionRequest,
      O: GrpcEvitaSessionResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to create read-only session which will return data in binary format. Part of the Private API.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.CreateBinaryReadOnlySession
     */
    createBinaryReadOnlySession: {
      name: "CreateBinaryReadOnlySession",
      I: GrpcEvitaSessionRequest,
      O: GrpcEvitaSessionResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to create read-write session which will return data in binary format. Part of the Private API.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.CreateBinaryReadWriteSession
     */
    createBinaryReadWriteSession: {
      name: "CreateBinaryReadWriteSession",
      I: GrpcEvitaSessionRequest,
      O: GrpcEvitaSessionResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to terminate existing session.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.TerminateSession
     */
    terminateSession: {
      name: "TerminateSession",
      I: GrpcEvitaSessionTerminationRequest,
      O: GrpcEvitaSessionTerminationResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get names of all existing catalogs.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.GetCatalogNames
     */
    getCatalogNames: {
      name: "GetCatalogNames",
      I: Empty,
      O: GrpcCatalogNamesResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get state of the catalog by its name.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.GetCatalogState
     */
    getCatalogState: {
      name: "GetCatalogState",
      I: GrpcGetCatalogStateRequest,
      O: GrpcGetCatalogStateResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to define a new catalog.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.DefineCatalog
     */
    defineCatalog: {
      name: "DefineCatalog",
      I: GrpcDefineCatalogRequest,
      O: GrpcDefineCatalogResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to delete an existing catalog.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.DeleteCatalogIfExists
     */
    deleteCatalogIfExists: {
      name: "DeleteCatalogIfExists",
      I: GrpcDeleteCatalogIfExistsRequest,
      O: GrpcDeleteCatalogIfExistsResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to update the catalog with a set of mutations.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.Update
     */
    update: {
      name: "Update",
      I: GrpcUpdateEvitaRequest,
      O: Empty,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to rename an existing catalog.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.RenameCatalog
     */
    renameCatalog: {
      name: "RenameCatalog",
      I: GrpcRenameCatalogRequest,
      O: GrpcRenameCatalogResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to replace an existing catalog.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaService.ReplaceCatalog
     */
    replaceCatalog: {
      name: "ReplaceCatalog",
      I: GrpcReplaceCatalogRequest,
      O: GrpcReplaceCatalogResponse,
      kind: MethodKind.Unary,
    },
  }
} as const;

