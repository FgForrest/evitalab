// @generated by protoc-gen-connect-es v1.4.0 with parameter "target=ts"
// @generated from file GrpcEvitaManagementAPI.proto (package io.evitadb.externalApi.grpc.generated, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { Empty, MethodKind } from "@bufbuild/protobuf";
import { GrpcCancelTaskRequest, GrpcCancelTaskResponse, GrpcDeleteFileToFetchRequest, GrpcDeleteFileToFetchResponse, GrpcEvitaCatalogStatisticsResponse, GrpcEvitaConfigurationResponse, GrpcEvitaServerStatusResponse, GrpcFetchFileRequest, GrpcFetchFileResponse, GrpcFilesToFetchRequest, GrpcFilesToFetchResponse, GrpcFileToFetchRequest, GrpcFileToFetchResponse, GrpcRestoreCatalogFromServerFileRequest, GrpcRestoreCatalogRequest, GrpcRestoreCatalogResponse, GrpcSpecifiedTaskStatusesRequest, GrpcSpecifiedTaskStatusesResponse, GrpcTaskStatusesRequest, GrpcTaskStatusesResponse, GrpcTaskStatusRequest, GrpcTaskStatusResponse } from "./GrpcEvitaManagementAPI_pb.js";

/**
 * This service contains RPCs that could be called by gRPC clients on evitaDB. Main purpose of this service is to provide
 * a way to create sessions and catalogs, and to update the catalog.
 *
 * @generated from service io.evitadb.externalApi.grpc.generated.EvitaManagementService
 */
export const EvitaManagementService = {
  typeName: "io.evitadb.externalApi.grpc.generated.EvitaManagementService",
  methods: {
    /**
     * Procedure used to obtain server status.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.ServerStatus
     */
    serverStatus: {
      name: "ServerStatus",
      I: Empty,
      O: GrpcEvitaServerStatusResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to obtain server configuration.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.GetConfiguration
     */
    getConfiguration: {
      name: "GetConfiguration",
      I: Empty,
      O: GrpcEvitaConfigurationResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to obtain catalog statistics.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.GetCatalogStatistics
     */
    getCatalogStatistics: {
      name: "GetCatalogStatistics",
      I: Empty,
      O: GrpcEvitaCatalogStatisticsResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to restore a catalog from backup.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.RestoreCatalog
     */
    restoreCatalog: {
      name: "RestoreCatalog",
      I: GrpcRestoreCatalogRequest,
      O: GrpcRestoreCatalogResponse,
      kind: MethodKind.ClientStreaming,
    },
    /**
     * Procedure used to restore a catalog from backup.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.RestoreCatalogFromServerFile
     */
    restoreCatalogFromServerFile: {
      name: "RestoreCatalogFromServerFile",
      I: GrpcRestoreCatalogFromServerFileRequest,
      O: GrpcRestoreCatalogResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get listing of task statuses.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.ListTaskStatuses
     */
    listTaskStatuses: {
      name: "ListTaskStatuses",
      I: GrpcTaskStatusesRequest,
      O: GrpcTaskStatusesResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get detail of particular task status.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.GetTaskStatus
     */
    getTaskStatus: {
      name: "GetTaskStatus",
      I: GrpcTaskStatusRequest,
      O: GrpcTaskStatusResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get multiple details of particular task statuses.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.GetTaskStatuses
     */
    getTaskStatuses: {
      name: "GetTaskStatuses",
      I: GrpcSpecifiedTaskStatusesRequest,
      O: GrpcSpecifiedTaskStatusesResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to cancel queued or running task.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.CancelTask
     */
    cancelTask: {
      name: "CancelTask",
      I: GrpcCancelTaskRequest,
      O: GrpcCancelTaskResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get listing of files available for fetching.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.ListFilesToFetch
     */
    listFilesToFetch: {
      name: "ListFilesToFetch",
      I: GrpcFilesToFetchRequest,
      O: GrpcFilesToFetchResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get single file by its id available for fetching.
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.GetFileToFetch
     */
    getFileToFetch: {
      name: "GetFileToFetch",
      I: GrpcFileToFetchRequest,
      O: GrpcFileToFetchResponse,
      kind: MethodKind.Unary,
    },
    /**
     * Procedure used to get file contents
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.FetchFile
     */
    fetchFile: {
      name: "FetchFile",
      I: GrpcFetchFileRequest,
      O: GrpcFetchFileResponse,
      kind: MethodKind.ServerStreaming,
    },
    /**
     * Procedure used to delete file contents
     *
     * @generated from rpc io.evitadb.externalApi.grpc.generated.EvitaManagementService.DeleteFile
     */
    deleteFile: {
      name: "DeleteFile",
      I: GrpcDeleteFileToFetchRequest,
      O: GrpcDeleteFileToFetchResponse,
      kind: MethodKind.Unary,
    },
  }
} as const;

