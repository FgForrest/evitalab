import { List as ImmutableList } from 'immutable'
import { Code, ConnectError } from '@connectrpc/connect'
import type {
    EvitaSessionServiceClient,
    EvitaTrafficRecordingServiceClient
} from '@/modules/database-driver/AbstractEvitaClient'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { InstanceTerminatedError } from '@/modules/database-driver/exception/InstanceTerminatedError'
import {
    type GetMutationsHistoryPageRequest,
    type GetMutationsHistoryPageResponse,
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
    type GrpcRenameCollectionResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaSessionAPI_pb'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { CatalogVersionAtResponse } from '@/modules/database-driver/request-response/CatalogVersionAtResponse'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import { ErrorTransformer } from '@/modules/database-driver/exception/ErrorTransformer'
import type { GrpcEntitySchema } from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb'
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
import { GrpcChangeCaptureContent } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import type {
    MutationHistoryConverter
} from '@/modules/database-driver/connector/grpc/service/converter/MutationHistoryConverter.ts'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import type { MutationHistoryRequest } from '@/modules/history-viewer/model/MutationHistoryRequest.ts'
import type {
    TrafficRecordingCaptureRequest
} from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordingCaptureRequest.ts'
import type { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord.ts'

const sessionTimeout: number = 30 * 1000 // 30 seconds

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
 */
export class EvitaClientSession {

    private readonly _id: string
    private readonly _catalogName: string
    private readonly _catalogState: CatalogState
    private _active: boolean = true
    private readonly _createdOn: number = Date.now()
    private readonly _callMetadata: any

    private readonly clientEntitySchemaAccessor: EntitySchemaAccessor

    readonly evitaClient: EvitaClient
    private readonly schemaCache: EvitaSchemaCache
    private readonly errorTransformerProvider: () => ErrorTransformer
    private readonly evitaSessionClientProvider: () => EvitaSessionServiceClient
    private readonly evitaTrafficRecordingClientProvider: () => EvitaTrafficRecordingServiceClient
    private readonly evitaValueConverterProvider: () => EvitaValueConverter
    private readonly catalogSchemaConverterProvider: () => CatalogSchemaConverter
    private readonly responseConverterProvider: () => EvitaResponseConverter
    private readonly taskStatusConverterProvider: () => TaskStatusConverter
    private readonly trafficRecordingConverterProvider: () => TrafficRecordingConverter
    private readonly mutationHistoryConverterProvider: () => MutationHistoryConverter

    constructor(id: string,
                catalogName: string,
                catalogState: CatalogState,
                evitaClient: EvitaClient,
                schemaCache: EvitaSchemaCache,
                errorTransformerProvider: () => ErrorTransformer,
                evitaSessionClientProvider: () => EvitaSessionServiceClient,
                evitaTrafficRecordingClientProvider: () => EvitaTrafficRecordingServiceClient,
                evitaValueConverterProvider: () => EvitaValueConverter,
                catalogSchemaConverterProvider: () => CatalogSchemaConverter,
                responseConverterProvider: () => EvitaResponseConverter,
                taskStatusConverterProvider: () => TaskStatusConverter,
                trafficRecordingConverterProvider: () => TrafficRecordingConverter,
                mutationHistoryConverterProvider: () => MutationHistoryConverter
    ) {
        this._id = id
        this._catalogName = catalogName
        this._catalogState = catalogState

        this.evitaClient = evitaClient
        this.schemaCache = schemaCache
        this.errorTransformerProvider = errorTransformerProvider

        this.evitaSessionClientProvider = evitaSessionClientProvider
        this.evitaTrafficRecordingClientProvider = evitaTrafficRecordingClientProvider
        this.evitaValueConverterProvider = evitaValueConverterProvider
        this.catalogSchemaConverterProvider = catalogSchemaConverterProvider
        this.responseConverterProvider = responseConverterProvider

        this.taskStatusConverterProvider = taskStatusConverterProvider
        this.trafficRecordingConverterProvider = trafficRecordingConverterProvider
        this.mutationHistoryConverterProvider = mutationHistoryConverterProvider

        this._callMetadata = {
            headers: {
                sessionId: id
            }
        }

        this.clientEntitySchemaAccessor = new ClientEntitySchemaAccessor(this)
    }

    get id(): string {
        return this._id
    }

    get catalogName(): string {
        return this._catalogName
    }

    get catalogState(): CatalogState {
        return this._catalogState
    }

    get isActive(): boolean {
        return this._active
    }

    private assertActive(): void {
        if (!this.isActive) {
            throw new InstanceTerminatedError(
                `Session '${this.id}' is not active.`
            )
        }
    }

    /**
     * Returns catalog schema of the catalog this session is connected to.
     */
    async getCatalogSchema(): Promise<CatalogSchema> {
        this.assertActive()
        return this.schemaCache.getLatestCatalogSchema(
            async () => await this.fetchCatalogSchema.bind(this)()
        )
    }

    /**
     * Returns list of all entity types available in this catalog.
     */
    async getAllEntityTypes(): Promise<ImmutableList<string>> {
        this.assertActive()
        try {
            const response: GrpcEntityTypesResponse = await this.evitaSessionClientProvider().getAllEntityTypes({}, this._callMetadata)
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
            async () => await this.fetchEntitySchema.bind(this)(entityType)
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
                .goLiveAndClose({}, this._callMetadata)

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
                    this._callMetadata
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
                    this._callMetadata
                )
            if (response.renamed) {
                this.schemaCache.removeLatestEntitySchema(entityType)
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
                        this._callMetadata
                    )
            if (response.deleted) {
                this.schemaCache.removeLatestEntitySchema(entityType)
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
                    this._callMetadata
                )

            for (const entity of queryResponse.recordPage?.sealedEntities || []) {
                const latestKnownEntitySchemaVersion: number | undefined = await this.schemaCache.getLatestEntitySchemaVersion(entity.entityType)
                if (latestKnownEntitySchemaVersion != undefined && latestKnownEntitySchemaVersion < entity.schemaVersion) {
                    await this.close()
                    await this.schemaCache.removeLatestEntitySchema(entity.entityType)
                }
            }

            return this.responseConverterProvider().convert(queryResponse)
        } catch (e: any) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    async getCatalogVersionAt(): Promise<CatalogVersionAtResponse> {
        this.assertActive()
        try {
            const result: GrpcCatalogVersionAtResponse = await this.evitaSessionClientProvider()
                .getCatalogVersionAt({}, this._callMetadata)

            return new CatalogVersionAtResponse(
                BigInt(result.version),
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
                this._callMetadata
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
            const response: GrpcFullBackupCatalogResponse = await this.evitaSessionClientProvider().fullBackupCatalog({}, this._callMetadata)
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
                    this._callMetadata
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
                    this._callMetadata
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
                    this._callMetadata
                )
            return this.taskStatusConverterProvider().convert(trafficResponse.taskStatus!)
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
                    this._callMetadata
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
            if (!reverse) {
                response = await this.evitaTrafficRecordingClientProvider()
                    .getTrafficRecordingHistoryList(request, this._callMetadata)
            } else {
                response = await this.evitaTrafficRecordingClientProvider()
                    .getTrafficRecordingHistoryListReversed(request, this._callMetadata)
            }
            return this.trafficRecordingConverterProvider()
                .convertGrpcTrafficRecords(response.trafficRecord)
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }


    async getMutationHistory(mutationHistoryRequest: MutationHistoryRequest,
                             limit: number): Promise<ImmutableList<ChangeCatalogCapture>> {
        this.assertActive()
        try {


            const request: GetMutationsHistoryPageRequest = { // todo pfi: celé toto tělo schovat do konverzní metody
                page: 1,
                pageSize: limit || 20,
                content: GrpcChangeCaptureContent.CHANGE_BODY,
                criteria: this.mutationHistoryConverterProvider().convertMutationHistoryRequest(mutationHistoryRequest)
            } as GetMutationsHistoryPageRequest

            const response: GetMutationsHistoryPageResponse = await this.evitaSessionClientProvider().getMutationsHistoryPage(request, this._callMetadata)

            console.log(response)
            const captures = response.changeCapture.map(i => this.mutationHistoryConverterProvider()
                .convertGrpcMutationHistory(i))

            console.log(captures)

            return ImmutableList(captures)

        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * Close the session. If already closed, does nothing.
     */
    async close(): Promise<void> {
        if (!this.isActive) {
            return
        }
        this._active = false

        try {
            await this.evitaSessionClientProvider()
                .close(
                    {},
                    this._callMetadata
                )
        } catch (e) {
            if (e instanceof ConnectError && e.code === Code.InvalidArgument) {
                // ignore, session already closed
                return
            }
            console.error(`Could not close the session '${this.id}': `, e)
        }
    }

    /**
     * This internal method will physically call over the network and fetch actual {@link CatalogSchema}.
     * @private
     */
    private async fetchCatalogSchema(): Promise<CatalogSchema> {
        try {
            const schemaRes: GrpcCatalogSchemaResponse = await this.evitaSessionClientProvider()
                .getCatalogSchema(
                    { nameVariants: true },
                    this._callMetadata
                )

            return this.catalogSchemaConverterProvider().convert(
                schemaRes.catalogSchema!,
                this.clientEntitySchemaAccessor
            )
        } catch (e: any) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    /**
     * This internal method will physically call over the network and fetch actual {@link EntitySchema}.
     * @private
     */
    private async fetchEntitySchema(entityType: string): Promise<EntitySchema | undefined> {
        try {
            const response: GrpcEntitySchemaResponse = await this.evitaSessionClientProvider()
                .getEntitySchema(
                    {
                        nameVariants: true,
                        entityType
                    },
                    this._callMetadata
                )

            if (response.entitySchema == undefined) {
                return undefined
            }

            return this.catalogSchemaConverterProvider().convertEntitySchema(
                response.entitySchema
            )
        } catch (e) {
            throw this.errorTransformerProvider().transformError(e)
        }
    }

    private async loadEntitySchemas(): Promise<ImmutableList<EntitySchema>> {
        try {
            const entityTypesResponse: GrpcEntityTypesResponse =
                await this.evitaSessionClientProvider().getAllEntityTypes({}, this._callMetadata)

            const entitySchemas: EntitySchema[] = []
            const entityTypes: string[] = entityTypesResponse.entityTypes
            for (const type of entityTypes) {
                const entitySchemaResult: GrpcEntitySchemaResponse =
                    await this.evitaSessionClientProvider().getEntitySchema(
                        {
                            nameVariants: true,
                            entityType: type
                        },
                        this._callMetadata
                    )
                const schema: GrpcEntitySchema | undefined = entitySchemaResult.entitySchema
                if (schema != null) {
                    entitySchemas.push(
                        this.catalogSchemaConverterProvider().convertEntitySchema(
                            schema
                        )
                    )
                }
            }

            return ImmutableList(entitySchemas)
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
