import { List as ImmutableList } from 'immutable'
import { Code, ConnectError } from '@connectrpc/connect'
import type { CallOptions } from '@connectrpc/connect'
import type {
    EvitaSessionServiceClient,
    EvitaTrafficRecordingServiceClient
} from '@/modules/database-driver/AbstractEvitaClient'
import { userQueryTimeout } from '@/modules/database-driver/AbstractEvitaClient'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { InstanceTerminatedError } from '@/modules/database-driver/exception/InstanceTerminatedError'
import {
    type GetMutationsHistoryPageRequest,
    type GetMutationsHistoryPageResponse,
    type GetTransactionOverviewRequest,
    type GetTransactionOverviewResponse,
    type GrpcBackupCatalogResponse,
    type GrpcCatalogSchemaResponse,
    type GrpcCatalogVersionAtResponse,
    type GrpcDefineEntitySchemaResponse,
    type GrpcDeleteCollectionResponse,
    type GrpcEntitySchemaResponse,
    type GrpcEntityTypesResponse,
    type GrpcFullBackupCatalogResponse,
    type GrpcGoLiveAndCloseResponse,
    type GrpcQueryResponse,
    type GrpcRenameCollectionResponse,
    type GrpcTransactionOverview
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaSessionAPI_pb'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { CatalogVersionAtResponse } from '@/modules/database-driver/request-response/CatalogVersionAtResponse'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import { ErrorTransformer } from '@/modules/database-driver/exception/ErrorTransformer'
import {
    EvitaResponseConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EvitaResponseConverter'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { TaskStatusConverter } from '@/modules/database-driver/connector/grpc/service/converter/TaskStatusConverter'
import type {
    GetTrafficHistoryListRequest,
    GetTrafficHistoryListResponse,
    GetTrafficRecordingLabelNamesResponse,
    GetTrafficRecordingStatusResponse,
    GetTrafficRecordingValuesNamesResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaTrafficRecordingAPI_pb'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import {
    TrafficRecordingConverter
} from '@/modules/database-driver/connector/grpc/service/converter/TrafficRecordingConverter'
import { EvitaSchemaCache } from '@/modules/database-driver/EvitaSchemaCache'
import type { EntitySchemaAccessor } from '@/modules/database-driver/request-response/schema/EntitySchemaAccessor'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import {
    GrpcChangeCaptureArea,
    GrpcChangeCaptureContent
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import type {
    MutationHistoryConverter
} from '@/modules/database-driver/connector/grpc/service/converter/MutationHistoryConverter.ts'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import {
    mergeTransactionOverviews,
    MutationHistoryPage,
    truncateBelowBoundary
} from '@/modules/database-driver/request-response/cdc/MutationHistoryPage.ts'
import type { MutationHistoryRequest } from '@/modules/history-viewer/model/MutationHistoryRequest.ts'
import type {
    TrafficRecordingCaptureRequest
} from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordingCaptureRequest.ts'
import type { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord.ts'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation.ts'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation.ts'
import { v4 as uuidv4 } from 'uuid'
import { CacheInvalidationReason } from '@/modules/database-driver/cache/CacheInvalidationReason.ts'
import type { PersistentCacheLayer } from '@/modules/database-driver/cache/PersistentCacheLayer.ts'

/**
 * Identity of a server-side session, as reported by evitaDB when the session was really created.
 */
export interface MaterializedSession {
    readonly sessionId: string
    readonly catalogState: CatalogState
}

/**
 * Session are created by the clients to envelope a "piece of work" with evitaDB. In web environment it's a good idea
 * to have session per request, in batch processing it's recommended to keep session per "record page" or "transaction".
 * In evitaLab, we shared read-only session between multiple requests for some time to not overload the server with
 * session for each user action. In case of read-write session, we create a new session for each user unit of work and
 * that close and commit.
 *
 * EvitaSession transaction behave like <a href="https://en.wikipedia.org/wiki/Snapshot_isolation">Snapshot</a>
 * transaction. When no transaction is explicitly opened - each query to Evita behaves as one small transaction. Data
 * updates are not allowed without explicitly opened transaction.
 *
 * A session is constructed as a **cheap local shell**: no server session exists until the first call that
 * genuinely needs the network asks for it (see {@link materialize}). Reads answered from a client-side cache
 * therefore never open a server session at all, which is what makes cached schemas readable while the server
 * is unreachable.
 */
export class EvitaClientSession {

    /**
     * Client-generated identifier that is stable for the whole lifetime of the shell, unlike {@link id},
     * which does not exist before materialization. Used in log messages only.
     */
    private readonly _debugId: string = uuidv4()
    private _id?: string
    private readonly _catalogName: string
    private _catalogState: CatalogState
    private _active: boolean = true
    /**
     * Materialization of the server-side session, in flight or already finished. Single-flighted: concurrent
     * callers share one creation. Cleared again when the creation fails, so a later call may retry.
     */
    private _materialization?: Promise<void>
    /**
     * Opens the server-side session. Supplied by {@link EvitaClient}, which knows how the session is to be
     * created (read-only/read-write, waiting for an outstanding close on a warming-up catalog).
     */
    private readonly sessionMaterializer: () => Promise<MaterializedSession>
    /**
     * Number of callers currently executing their logic against this session (see {@link acquire}).
     */
    private _usages: number = 0
    /**
     * Close requested by {@link closeWhenIdle} while the session was still in use. Resolved once the
     * session is actually closed.
     */
    private _pendingClose?: { promise: Promise<void>, resolve: () => void }
    /**
     * gRPC call metadata identifying the server-side session. Present only once materialized.
     */
    private _callMetadata?: { headers: Record<string, string> }

    private readonly clientEntitySchemaAccessor: EntitySchemaAccessor

    readonly evitaClient: EvitaClient
    private readonly schemaCache: EvitaSchemaCache
    private readonly errorTransformerProvider: () => ErrorTransformer
    private readonly evitaSessionClientProvider: () => EvitaSessionServiceClient
    private readonly evitaTrafficRecordingClientProvider: () => EvitaTrafficRecordingServiceClient
    private readonly catalogSchemaConverterProvider: () => CatalogSchemaConverter
    private readonly responseConverterProvider: () => EvitaResponseConverter
    private readonly taskStatusConverterProvider: () => TaskStatusConverter
    private readonly trafficRecordingConverterProvider: () => TrafficRecordingConverter
    private readonly mutationHistoryConverterProvider: () => MutationHistoryConverter
    /**
     * Access to the on-disk cache, used to persist raw schema payloads right where they arrive. Absent when
     * persistence is unavailable.
     */
    private readonly persistentCacheLayerProvider: () => PersistentCacheLayer | undefined

    constructor(catalogName: string,
                catalogState: CatalogState,
                sessionMaterializer: () => Promise<MaterializedSession>,
                evitaClient: EvitaClient,
                schemaCache: EvitaSchemaCache,
                errorTransformerProvider: () => ErrorTransformer,
                evitaSessionClientProvider: () => EvitaSessionServiceClient,
                evitaTrafficRecordingClientProvider: () => EvitaTrafficRecordingServiceClient,
                _evitaValueConverterProvider: () => EvitaValueConverter,
                catalogSchemaConverterProvider: () => CatalogSchemaConverter,
                responseConverterProvider: () => EvitaResponseConverter,
                taskStatusConverterProvider: () => TaskStatusConverter,
                trafficRecordingConverterProvider: () => TrafficRecordingConverter,
                mutationHistoryConverterProvider: () => MutationHistoryConverter,
                persistentCacheLayerProvider: () => PersistentCacheLayer | undefined = () => undefined
    ) {
        this._catalogName = catalogName
        this._catalogState = catalogState
        this.sessionMaterializer = sessionMaterializer

        this.evitaClient = evitaClient
        this.schemaCache = schemaCache
        this.errorTransformerProvider = errorTransformerProvider

        this.evitaSessionClientProvider = evitaSessionClientProvider
        this.evitaTrafficRecordingClientProvider = evitaTrafficRecordingClientProvider
        this.catalogSchemaConverterProvider = catalogSchemaConverterProvider
        this.responseConverterProvider = responseConverterProvider

        this.taskStatusConverterProvider = taskStatusConverterProvider
        this.trafficRecordingConverterProvider = trafficRecordingConverterProvider
        this.mutationHistoryConverterProvider = mutationHistoryConverterProvider
        this.persistentCacheLayerProvider = persistentCacheLayerProvider

        this.clientEntitySchemaAccessor = new ClientEntitySchemaAccessor(this)
    }

    /**
     * Identifier of the server-side session, or `undefined` while the session is still an unmaterialized
     * shell. Use {@link debugId} for logging, it is always available.
     */
    get id(): string | undefined {
        return this._id
    }

    /**
     * Client-generated identifier of this session, stable from construction on. Intended for log messages.
     */
    get debugId(): string {
        return this._debugId
    }

    get catalogName(): string {
        return this._catalogName
    }

    /**
     * State of the catalog this session is tied to. Seeded from the catalog statistics the client already
     * holds and refreshed from the server's answer once the session materializes.
     */
    get catalogState(): CatalogState {
        return this._catalogState
    }

    get isActive(): boolean {
        return this._active
    }

    /**
     * Whether the server-side session has already been opened.
     */
    get isMaterialized(): boolean {
        return this._callMetadata != undefined
    }

    private assertActive(): void {
        if (!this.isActive) {
            throw new InstanceTerminatedError(
                `Session '${this._debugId}' is not active.`
            )
        }
    }

    /**
     * Opens the server-side session on the first call that genuinely needs the network, and does nothing
     * on every subsequent call. Concurrent callers share a single creation; a failed attempt is forgotten,
     * so a later call retries against a server that may have recovered in the meantime (the awaiters of
     * the failed attempt all observe its failure).
     *
     * A closed shell refuses to materialize: opening a server session nobody can close any more would leak
     * it. The resulting {@link InstanceTerminatedError} is exactly what
     * {@link EvitaClient.executeInSharedSession} recognizes as "we closed this session underneath the
     * caller" and replays on a fresh session.
     */
    private materialize(): Promise<void> {
        this.assertActive()
        if (this._callMetadata != undefined) {
            return Promise.resolve()
        }
        if (this._materialization == undefined) {
            this._materialization = this.sessionMaterializer()
                .then((materialized: MaterializedSession) => {
                    this._id = materialized.sessionId
                    this._catalogState = materialized.catalogState
                    this._callMetadata = { headers: { sessionId: materialized.sessionId } }
                })
                .catch((e: unknown) => {
                    this._materialization = undefined
                    throw e
                })
        }
        return this._materialization
    }

    /**
     * Returns the gRPC call metadata identifying the server-side session, opening the session first if it
     * does not exist yet. **Every server-touching method obtains its metadata through this method** — it is
     * the single point where a session shell turns into a real server session, so a call that needs the
     * network can never accidentally skip the creation.
     */
    private async callMetadata(): Promise<{ headers: Record<string, string> }> {
        await this.materialize()
        const callMetadata: { headers: Record<string, string> } | undefined = this._callMetadata
        if (callMetadata == undefined) {
            throw new UnexpectedError(`Session '${this._debugId}' has not been materialized.`)
        }
        return callMetadata
    }

    /**
     * Returns the {@link callMetadata} widened with an explicit deadline for a single call. Without one, the
     * transport-wide default deadline applies; pass one only for calls that are legitimately allowed to run
     * longer than metadata, which on this session means anything carrying a user-issued query.
     *
     * The classification lives here rather than in the callers above the driver: this class is what knows
     * which gRPC method is a query, and no signature outside the driver has to mention timeouts because of it.
     */
    private async callOptions(timeoutMs: number): Promise<CallOptions> {
        return { ...(await this.callMetadata()), timeoutMs }
    }

    /**
     * Returns catalog schema of the catalog this session is connected to.
     */
    async getCatalogSchema(): Promise<CatalogSchema> {
        this.assertActive()
        return this.schemaCache.getLatestCatalogSchema(
            async () => await this.fetchLatestCatalogSchema.bind(this)()
        )
    }

    /**
     * Returns list of all entity types available in this catalog.
     */
    async getAllEntityTypes(): Promise<ImmutableList<string>> {
        this.assertActive()
        try {
            const response: GrpcEntityTypesResponse = await this.evitaSessionClientProvider().getAllEntityTypes({}, await this.callMetadata())
            return ImmutableList(response.entityTypes)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Returns schema definition for entity of the specified type.
     */
    async getEntitySchema(entityType: string): Promise<EntitySchema | undefined> {
        this.assertActive()
        return await this.schemaCache.getLatestEntitySchema(
            entityType,
            async () => await this.fetchLatestEntitySchema.bind(this)(entityType)
        )
    }

    /**
     * Returns schema definition for entity of the specified type
     */
    async getEntitySchemaOrThrowException(entityType: string): Promise<EntitySchema> {
        const entitySchema: EntitySchema | undefined = await this.getEntitySchema(entityType)
        if (entitySchema == undefined) {
            throw new UnexpectedError(`Required schema for collection '${entityType}' not found.`)
        }
        return entitySchema
    }

    /**
     * Switches catalog to the {@link CatalogState#ALIVE} state and terminates the Evita session so that next session is
     * operating in the new catalog state.
     *
     * Session is {@link #close() closed} only when the state transition successfully occurs and this is signalized
     * by return value.
     */
    async goLiveAndClose(): Promise<boolean> {
        this.assertActive()
        try {
            const response: GrpcGoLiveAndCloseResponse = await this.evitaSessionClientProvider()
                // the whole warm-up-to-alive transition happens inside this call, so it is patient by nature
                .goLiveAndClose({}, await this.callOptions(userQueryTimeout))

            if (response.success) {
                this._active = false
            }

            return response.success
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Method creates new a new entity schema and collection for it in the catalog this session is tied to.
     */
    async createCollection(entityType: string): Promise<void> {
        this.assertActive()
        try {
            const response: GrpcDefineEntitySchemaResponse = await this.evitaSessionClientProvider()
                .defineEntitySchema(
                    { entityType },
                    await this.callMetadata()
                )
            const entitySchema: EntitySchema = this.catalogSchemaConverterProvider()
                .convertEntitySchema(response.entitySchema!)
            this.schemaCache.setLatestEntitySchema(entitySchema)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Renames entire collection of entities along with its schema. After this operation there will be nothing left
     * of the data that belong to the specified entity type, and entity collection under the new name becomes available.
     * If you need to rename entity collection to a name of existing collection use
     * the {@link #replaceCollection(String, String)} method instead.
     *
     * In case exception occurs the original collection (`entityType`) is guaranteed to be untouched,
     * and the `newName` will not be present.
     */
    async renameCollection(
        entityType: string,
        newName: string
    ): Promise<boolean> {
        this.assertActive()
        try {
            const response: GrpcRenameCollectionResponse = await this.evitaSessionClientProvider()
                .renameCollection(
                    {
                        entityType,
                        newName
                    },
                    await this.callMetadata()
                )
            if (response.renamed) {
                await this.schemaCache.removeLatestEntitySchema(CacheInvalidationReason.ChangeEvidence, entityType)
            }

            return response.renamed
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    async deleteCollection(entityType: string): Promise<boolean> {
        this.assertActive()
        try {
            const response: GrpcDeleteCollectionResponse =
                await this.evitaSessionClientProvider()
                    .deleteCollection(
                        {
                            entityType
                        },
                        await this.callMetadata()
                    )
            if (response.deleted) {
                await this.schemaCache.removeLatestEntitySchema(CacheInvalidationReason.ChangeEvidence, entityType)
            }

            return response.deleted
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Returns list of entities for given evitaQL query from given catalog for the given evitaDB connection
     *
     * @param query query to request entities
     */
    async query(query: string): Promise<EvitaResponse> {
        this.assertActive()
        try {
            const queryResponse: GrpcQueryResponse = await this.evitaSessionClientProvider()
                .queryUnsafe(
                    {
                        query
                    },
                    // a query the user wrote; on a large catalog it may legitimately run for minutes
                    await this.callOptions(userQueryTimeout)
                )

            for (const entity of queryResponse.recordPage?.sealedEntities || []) {
                const latestKnownEntitySchemaVersion: number | undefined =
                    this.schemaCache.getLatestEntitySchemaVersionInMemory(entity.entityType)
                if (latestKnownEntitySchemaVersion != undefined && latestKnownEntitySchemaVersion < entity.schemaVersion) {
                    await this.close()
                    await this.schemaCache.removeLatestEntitySchema(
                        CacheInvalidationReason.ChangeEvidence,
                        entity.entityType
                    )
                }
            }

            return this.responseConverterProvider().convert(queryResponse)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    async getCatalogVersionAt(): Promise<CatalogVersionAtResponse> {
        this.assertActive()
        try {
            const result: GrpcCatalogVersionAtResponse = await this.evitaSessionClientProvider()
                .getCatalogVersionAt({}, await this.callMetadata())

            return new CatalogVersionAtResponse(
                BigInt(result.startVersion),
                BigInt(result.endVersion),
                EvitaValueConverter.convertGrpcOffsetDateTime(result.introducedAt!)
            )
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    async backupCatalog(pastMoment: OffsetDateTime | undefined, includingWAL: boolean): Promise<TaskStatus> {
        this.assertActive()
        try {
            const response: GrpcBackupCatalogResponse = await this.evitaSessionClientProvider().backupCatalog(
                {
                    includingWAL,
                    pastMoment: pastMoment != undefined
                        ? {
                            offset: pastMoment.offset,
                            timestamp: pastMoment.timestamp
                        }
                        : undefined
                },
                await this.callMetadata()
            )
            // todo lho send to management task tracker
            return this.taskStatusConverterProvider().convert(response.taskStatus!)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    async fullBackupCatalog(): Promise<TaskStatus> {
        this.assertActive()
        try {
            const response: GrpcFullBackupCatalogResponse = await this.evitaSessionClientProvider().fullBackupCatalog({}, await this.callMetadata())
            return this.taskStatusConverterProvider().convert(response.taskStatus!)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Returns a stream of all unique labels names ordered by cardinality of their values present in the traffic recording.
     */
    async getLabelNamesOrderedByCardinality(nameStartsWith: string, limit: number): Promise<ImmutableList<string>> {
        this.assertActive()
        try {
            const response: GetTrafficRecordingLabelNamesResponse = await this.evitaTrafficRecordingClientProvider()
                .getTrafficRecordingLabelsNamesOrderedByCardinality(
                    {
                        nameStartsWith,
                        limit
                    },
                    // a cardinality scan over the whole recording buffer, not a metadata lookup
                    await this.callOptions(userQueryTimeout)
                )
            return ImmutableList(response.labelName || [])
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Returns a stream of all unique label values ordered by cardinality present in the traffic recording.
     */
    async getLabelValuesOrderedByCardinality(
        labelName: string,
        valueStartsWith: string,
        limit: number
    ): Promise<ImmutableList<string>> {
        this.assertActive()
        try {
            const response: GetTrafficRecordingValuesNamesResponse = await this.evitaTrafficRecordingClientProvider()
                .getTrafficRecordingLabelValuesOrderedByCardinality(
                    {
                        labelName,
                        valueStartsWith,
                        limit
                    },
                    // a cardinality scan over the whole recording buffer, not a metadata lookup
                    await this.callOptions(userQueryTimeout)
                )
            return ImmutableList(response.labelValue || [])
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Initiates a recording session for traffic data with the specified parameters.
     */
    async startRecording(samplingRate: number,
                         exportFile: boolean,
                         maxDurationInMilliseconds: bigint | undefined,
                         maxFileSizeInBytes: bigint | undefined,
                         chunkFileSizeInBytes: bigint | undefined): Promise<TaskStatus> {
        this.assertActive()
        try {
            const trafficResponse: GetTrafficRecordingStatusResponse = await this.evitaTrafficRecordingClientProvider()
                .startTrafficRecording(
                    {
                        samplingRate,
                        maxDurationInMilliseconds,
                        exportFile,
                        maxFileSizeInBytes,
                        chunkFileSizeInBytes
                    },
                    await this.callMetadata()
                )
            return this.taskStatusConverterProvider().convert(trafficResponse.taskStatus!)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Requests an on-demand export of the currently buffered traffic recording window into a downloadable ZIP
     * archive. The export is not gated by a running recording task, it only requires a rich traffic recorder to be
     * installed (enabled in server configuration or an on-demand recording being active). Returns the status of
     * the created server task producing the archive.
     *
     * @param chunkFileSizeInBytes desired approximate size of the individual chunk files inside the archive,
     *                             leave undefined to use the server default
     */
    async exportTrafficRecording(chunkFileSizeInBytes: bigint | undefined): Promise<TaskStatus> {
        this.assertActive()
        try {
            const response: GetTrafficRecordingStatusResponse = await this.evitaTrafficRecordingClientProvider()
                .exportTrafficRecording(
                    {
                        chunkFileSizeInBytes: (chunkFileSizeInBytes != undefined && chunkFileSizeInBytes > 0n)
                            ? chunkFileSizeInBytes
                            : undefined
                    },
                    await this.callMetadata()
                )
            return this.taskStatusConverterProvider().convert(response.taskStatus!)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Stops the ongoing recording task identified by the provided task ID.
     */
    async stopRecording(taskId: Uuid): Promise<TaskStatus> {
        this.assertActive()
        try {
            const response: GetTrafficRecordingStatusResponse = await this.evitaTrafficRecordingClientProvider()
                .stopTrafficRecording(
                    {
                        taskStatusId: {
                            mostSignificantBits: taskId.mostSignificantBits.toString(),
                            leastSignificantBits: taskId.leastSignificantBits.toString()
                        }
                    },
                    await this.callMetadata()
                )
            return this.taskStatusConverterProvider().convert(response.taskStatus!)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Returns a list of recordings that occurred in the catalog that match the specified criteria
     * in the request. The method returns the list of recordings in the order of their execution within sessions, and
     * sessions are ordered by the timestamp of their finalization. The oldest records are returned first unless `reverse`
     * is set to `true`.
     */
    async getRecordings(
        captureRequest: TrafficRecordingCaptureRequest,
        limit: number,
        reverse: boolean = false
    ): Promise<ImmutableList<TrafficRecord>> {
        this.assertActive()
        try {
            const request: GetTrafficHistoryListRequest = {
                limit,
                criteria: this.trafficRecordingConverterProvider()
                    .convertTrafficRecordingCaptureRequest(captureRequest)
            } as GetTrafficHistoryListRequest

            let response: GetTrafficHistoryListResponse
            // a criteria search over the recording buffer, which on a busy catalog behaves like a user query
            const callOptions: CallOptions = await this.callOptions(userQueryTimeout)
            if (!reverse) {
                response = await this.evitaTrafficRecordingClientProvider()
                    .getTrafficRecordingHistoryList(request, callOptions)
            } else {
                response = await this.evitaTrafficRecordingClientProvider()
                    .getTrafficRecordingHistoryListReversed(request, callOptions)
            }
            return this.trafficRecordingConverterProvider()
                .convertGrpcTrafficRecords(response.trafficRecord)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }


    /**
     * Returns a single page of the catalog's mutation history, newest records first.
     *
     * `MutationHistoryRequest.sinceVersion` is the reverse-pagination anchor (an **upper** bound the
     * server clamps to the current catalog version); the API has no lower bound, so
     * `MutationHistoryRequest.newerThanVersion` is applied here, client-side. This split is by design
     * and permanent — see evitaDB#1349.
     */
    async getMutationHistory(mutationHistoryRequest: MutationHistoryRequest,
                             limit: number): Promise<MutationHistoryPage> {
        this.assertActive()
        try {
            const request: GetMutationsHistoryPageRequest = {
                ...(mutationHistoryRequest.page != undefined ? { page: mutationHistoryRequest.page } : {}),
                pageSize: limit,
                ...(mutationHistoryRequest.sinceVersion != undefined
                    ? { sinceVersion: BigInt(mutationHistoryRequest.sinceVersion) }
                    : {}),
                ...(mutationHistoryRequest.sinceIndex != undefined
                    ? { sinceIndex: mutationHistoryRequest.sinceIndex }
                    : {}),
                ...((mutationHistoryRequest.from != undefined || mutationHistoryRequest.to != undefined)
                    ? {
                        timeFrame: {
                            from: mutationHistoryRequest.from ? EvitaValueConverter.convertOffsetDateTime(mutationHistoryRequest.from) : undefined,
                            to: mutationHistoryRequest.to ? EvitaValueConverter.convertOffsetDateTime(mutationHistoryRequest.to) : undefined
                        }
                    }
                    : {}),
                content: GrpcChangeCaptureContent.CHANGE_BODY,
                criteria: this.mutationHistoryConverterProvider().convertMutationHistoryRequest(mutationHistoryRequest)
            } as GetMutationsHistoryPageRequest;


            // a wide time range over a busy catalog scans the WAL, so this is a query rather than metadata
            const response: GetMutationsHistoryPageResponse = await this.evitaSessionClientProvider().getMutationsHistoryPage(request, await this.callOptions(userQueryTimeout))
            const captures: ChangeCatalogCapture[] = truncateBelowBoundary(
                response.changeCapture.map(i => this.mutationHistoryConverterProvider().convertGrpcMutationHistory(i)),
                mutationHistoryRequest.newerThanVersion
            )
            if (captures.length === 0) {
                return MutationHistoryPage.empty()
            }

            const catalogVersionIdList = [...new Set(
                captures
                    .filter(i => i.version != undefined)
                    .map(i => i.version.toString())
            )];

            let transactionCaptures:ChangeCatalogCapture[] = [];
            if (mutationHistoryRequest.loadTransaction) {
                const transactionRequest: GetTransactionOverviewRequest = {catalogVersion: catalogVersionIdList} as GetTransactionOverviewRequest
                const transactionResponse: GetTransactionOverviewResponse = await this.evitaSessionClientProvider().getTransactionOverview(transactionRequest, await this.callOptions(userQueryTimeout))
                transactionCaptures = transactionResponse.transactionOverviews.map(i => this.convertGrpcTransactionOverview(i));
            }

            // the transaction header of a group is streamed only once, so pages beyond the first do not
            // carry the header of the transaction their first capture belongs to — the overviews are
            // fetched locally to compensate and must not be dropped as redundant (evitaDB#1349)
            return new MutationHistoryPage(
                ImmutableList(mergeTransactionOverviews(captures, transactionCaptures)),
                captures.length
            )
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    // todo move me to a separate class
    private convertGrpcTransactionOverview(grpcTransactionOverview: GrpcTransactionOverview): ChangeCatalogCapture {


        const mutation =  new TransactionMutation(
            EvitaValueConverter.convertGrpcUuid(grpcTransactionOverview.transactionId!).toString(),
            Number(grpcTransactionOverview.catalogVersion),
            grpcTransactionOverview.transactionChanges.reduce((acc, i) => acc + i.mutationCount, 0),
            Number(grpcTransactionOverview.transactionChanges.reduce((acc, i) => acc + Number(i.walSizeInBytes), 0)),
            EvitaValueConverter.convertGrpcOffsetDateTime(grpcTransactionOverview.commitTimestamp!)
        )

        return new ChangeCatalogCapture(
            Number(grpcTransactionOverview.catalogVersion),
             0,
            CatalogSchemaConverter.toCaptureArea(GrpcChangeCaptureArea.INFRASTRUCTURE),
            undefined,
            undefined,
            Operation.Transaction,
            mutation,
            EvitaValueConverter.convertGrpcOffsetDateTime(grpcTransactionOverview.commitTimestamp!)
        )

    }

    /**
     * Marks the session as being used by a caller. An acquired session is never closed underneath the
     * caller by {@link closeWhenIdle}; it is only evicted from the shared-session registry, so no new
     * caller can obtain it.
     */
    acquire(): void {
        this._usages++
    }

    /**
     * Releases the session previously taken by {@link acquire}. When a close has been requested in the
     * meantime and this was the last user, the session is closed right away.
     */
    release(): void {
        this._usages--
        if (this._usages <= 0 && this._pendingClose != undefined) {
            void this.closePending()
        }
    }

    /**
     * Closes the session as soon as nobody uses it: immediately when idle, otherwise once the last
     * in-flight caller {@link release}s it. Unlike {@link close} it never terminates a call that is
     * already executing (the server would answer it with a "session already terminated" error).
     *
     * @return promise resolved once the session is really closed; repeated calls return the same promise
     */
    closeWhenIdle(): Promise<void> {
        if (this._usages <= 0) {
            return this.close()
        }
        if (this._pendingClose == undefined) {
            let resolvePendingClose: () => void = () => { /* replaced synchronously below */ }
            const promise: Promise<void> = new Promise<void>(resolve => { resolvePendingClose = resolve })
            this._pendingClose = { promise, resolve: resolvePendingClose }
        }
        return this._pendingClose.promise
    }

    private async closePending(): Promise<void> {
        const pendingClose = this._pendingClose
        this._pendingClose = undefined
        try {
            await this.close()
        } finally {
            pendingClose?.resolve()
        }
    }

    /**
     * Close the session. If already closed, does nothing.
     *
     * A shell that never materialized closes purely locally — there is no server-side session to close. A
     * close that races an in-flight materialization waits for its outcome first, so a session that did get
     * created is never left open on the server.
     */
    async close(): Promise<void> {
        if (!this.isActive) {
            return
        }
        this._active = false

        const materialization: Promise<void> | undefined = this._materialization
        if (materialization != undefined) {
            try {
                await materialization
            } catch {
                // the server session was never created, there is nothing to close
            }
        }

        const callMetadata: { headers: Record<string, string> } | undefined = this._callMetadata
        if (callMetadata == undefined) {
            return
        }

        try {
            await this.evitaSessionClientProvider()
                .close(
                    {},
                    callMetadata
                )
        } catch (e) {
            if (e instanceof ConnectError && e.code === Code.InvalidArgument) {
                // ignore, session already closed
                return
            }
            console.error(`Could not close the session '${this._debugId}': `, e)
        }
    }

    /**
     * Fetches the {@link CatalogSchema} straight from the server, bypassing every cache, and persists the raw
     * payload on the way. Ordinary reads must go through {@link getCatalogSchema} — this method exists for the
     * fetch-first refresh paths, which need to know the server's current version before deciding anything.
     *
     * This is also the write-through point of the persistent cache: the raw protobuf message is only available
     * here, and persisting it here means a cached schema and a freshly fetched one always went through the very
     * same converter.
     */
    async fetchLatestCatalogSchema(): Promise<CatalogSchema> {
        this.assertActive()
        try {
            const schemaRes: GrpcCatalogSchemaResponse = await this.evitaSessionClientProvider()
                .getCatalogSchema(
                    { nameVariants: true },
                    await this.callMetadata()
                )

            this.persistentCacheLayerProvider()
                ?.persistCatalogSchema(this._catalogName, schemaRes.catalogSchema!)

            return this.catalogSchemaConverterProvider().convert(
                schemaRes.catalogSchema!,
                this.clientEntitySchemaAccessor
            )
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Fetches the {@link EntitySchema} straight from the server, bypassing every cache, and persists the raw
     * payload on the way. The entity-level counterpart of {@link fetchLatestCatalogSchema}.
     */
    async fetchLatestEntitySchema(entityType: string): Promise<EntitySchema | undefined> {
        this.assertActive()
        try {
            const response: GrpcEntitySchemaResponse = await this.evitaSessionClientProvider()
                .getEntitySchema(
                    {
                        nameVariants: true,
                        entityType
                    },
                    await this.callMetadata()
                )

            if (response.entitySchema == undefined) {
                return undefined
            }

            this.persistentCacheLayerProvider()
                ?.persistEntitySchema(this._catalogName, response.entitySchema)

            return this.catalogSchemaConverterProvider().convertEntitySchema(
                response.entitySchema
            )
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

}

class ClientEntitySchemaAccessor implements EntitySchemaAccessor {

    private readonly session: EvitaClientSession

    constructor(session: EvitaClientSession) {
        this.session = session
    }

    async getEntitySchema(entityType: string): Promise<EntitySchema | undefined> {
        if (this.session.isActive) {
            return await this.session.getEntitySchema(entityType)
        } else {
            return await this.session.evitaClient.queryCatalog(
                this.session.catalogName,
                async (session) => {
                    return await session.getEntitySchema(entityType)
                }
            )
        }
    }

    async getEntitySchemas(): Promise<ImmutableList<EntitySchema>> {
        let allEntityTypes: ImmutableList<string>
        if (this.session.isActive) {
            allEntityTypes = await this.session.getAllEntityTypes()
        } else {
            allEntityTypes = await this.session.evitaClient.queryCatalog(
                this.session.catalogName,
                async (session) => {
                    return await session.getAllEntityTypes()
                }
            )
        }

        const entitySchemas: EntitySchema[] = []
        for (const entityType of allEntityTypes) {
            const entitySchema: EntitySchema | undefined = await this.getEntitySchema(entityType)
            if (entitySchema != undefined) {
                entitySchemas.push(entitySchema)
            }
        }
        return ImmutableList(entitySchemas)
    }

}
