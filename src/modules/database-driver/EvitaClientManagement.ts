import { Empty, StringValue } from '@bufbuild/protobuf'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { splitStringWithCaseIntoWords } from '@/utils/string'
import Immutable, { List } from 'immutable'
import { CatalogStatisticsConverter } from '@/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsConverter'
import { EvitaManagementServiceClient } from '@/modules/database-driver/AbstractEvitaClient'
import {
    ReservedKeywordsConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ReservedKeywordsConverter'
import { TaskStateConverter } from '@/modules/database-driver/connector/grpc/service/converter/TaskStateConverter'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import {
    GrpcDeleteFileToFetchResponse,
    GrpcEvitaCatalogStatisticsResponse,
    GrpcEvitaConfigurationResponse,
    GrpcEvitaServerStatusResponse, GrpcReservedKeywordsResponse, GrpcRestoreCatalogUnaryRequest,
    GrpcRestoreCatalogUnaryResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import { ErrorTransformer } from '@/modules/database-driver/exception/ErrorTransformer'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import { GrpcTaskStatus } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { ClassifierType } from '@/modules/database-driver/data-type/ClassifierType'
import { Keyword } from '@/modules/database-driver/connector/grpc/model/Keyword'
import { ServerStatusConverter } from '@/modules/database-driver/connector/grpc/service/converter/ServerStatusConverter'
import { ServerFileConverter } from '@/modules/database-driver/connector/grpc/service/converter/ServerFileConverter'
import { TaskStatusConverter } from '@/modules/database-driver/connector/grpc/service/converter/TaskStatusConverter'
import ky from 'ky'
import { EventType } from '@/modules/database-driver/request-response/jfr/EventType'
import { EvitaCatalogStatisticsCache } from '@/modules/database-driver/EvitaCatalogStatisticsCache'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'
import { EvitaServerMetadataCache } from '@/modules/database-driver/EvitaServerMetadataCache'


/**
 * Chunk size for upload local backup files
 */
const chunkSize: number = 500 * 1024; // 500 KB chunks
/**
 * Timeout in milliseconds in which a file chunks needs to be uploaded to server
 */
const fileChunkUploadTimeout: number = 60000 // 1 minute

/**
 * Global management service that allows to execute various management tasks on the Evita instance and retrieve
 * global evitaDB information. These operations might require special permissions for execution and are not used
 * daily and therefore are segregated into special management class.
 */
export class EvitaClientManagement {

    // todo lho task tracker

    private readonly classifierFormatPattern: RegExp = /^[A-Za-z][A-Za-z0-9_.\-~]{0,254}$/

    private reservedKeywords?: Immutable.Map<ClassifierType, Immutable.List<Keyword>>

    private readonly serverMetadataCache: EvitaServerMetadataCache
    private readonly catalogStatisticsCache: EvitaCatalogStatisticsCache
    private readonly errorTransformer: ErrorTransformer

    private readonly evitaClientProvider: () => EvitaClient
    private readonly evitaManagementClientProvider: () => EvitaManagementServiceClient

    private readonly evitaValueConverterProvider: () => EvitaValueConverter
    private readonly catalogStatisticsConverterProvider: () => CatalogStatisticsConverter
    private readonly serverStatusConverterProvider: () => ServerStatusConverter
    private readonly reservedKeywordsConverterProvider: () => ReservedKeywordsConverter
    private readonly serverFileConverterProvider: () => ServerFileConverter
    private readonly taskStateConverterProvider: () => TaskStateConverter
    private readonly taskStatusConverterProvider: () => TaskStatusConverter

    constructor(errorTransformer: ErrorTransformer,
                evitaClient: EvitaClient,
                evitaManagementClientProvider: () => EvitaManagementServiceClient,
                evitaValueConverterProvider: () => EvitaValueConverter,
                catalogStatisticsConverterProvider: () => CatalogStatisticsConverter,
                serverStatusConverterProvider: () => ServerStatusConverter,
                reservedKeywordsConverterProvider: () => ReservedKeywordsConverter,
                serverFileConverterProvider: () => ServerFileConverter,
                taskStateConverterProvider: () => TaskStateConverter,
                taskStatusConverterProvider: () => TaskStatusConverter) {
        this.serverMetadataCache = new EvitaServerMetadataCache(
            async () => await this.fetchServerStatus.bind(this)(),
            async () => await this.fetchConfiguration.bind(this)()
        )
        this.catalogStatisticsCache = new EvitaCatalogStatisticsCache(
            async () => await this.fetchCatalogStatistics.bind(this)()
        )
        this.errorTransformer = errorTransformer
        this.evitaClientProvider = () => evitaClient
        this.evitaManagementClientProvider = evitaManagementClientProvider
        this.evitaValueConverterProvider = evitaValueConverterProvider
        this.catalogStatisticsConverterProvider = catalogStatisticsConverterProvider
        this.serverStatusConverterProvider = serverStatusConverterProvider
        this.reservedKeywordsConverterProvider = reservedKeywordsConverterProvider
        this.serverFileConverterProvider = serverFileConverterProvider
        this.taskStateConverterProvider = taskStateConverterProvider
        this.taskStatusConverterProvider = taskStatusConverterProvider
    }

    /**
     * Clears the cache of server metadata. Any subsequent fetches will provide fresh data from the server.
     */
    async clearServerMetadataCache(): Promise<void> {
        await this.serverMetadataCache.clear()
    }

    /**
     * Registers a callback that will be called when the server status change.
     * @returns id of the callback
     */
    registerServerStatusChangeCallback(callback: () => Promise<void>): string {
        return this.serverMetadataCache.registerServerStatusChangeCallback(callback)
    }

    /**
     * Unregisters the callback that was registered with registerServerStatusChangeCallback.
     * @param id
     */
    unregisterServerStatusChangeCallback(id: string): void {
        this.serverMetadataCache.unregisterServerStatusChangeCallback(id)
    }

    /**
     * Registers a callback that will be called when the server configuration change.
     * @returns id of the callback
     */
    registerConfigurationChangeCallback(callback: () => Promise<void>): string {
        return this.serverMetadataCache.registerConfigurationChangeCallback(callback)
    }

    /**
     * Unregisters the callback that was registered with registerConfigurationChangeCallback.
     * @param id
     */
    unregisterConfigurationChangeCallback(id: string): void {
        this.serverMetadataCache.unregisterConfigurationChangeCallback(id)
    }

    /**
     * Clears the cache of catalog statistics. Any subsequent fetch of statistics will provide fresh data from the server.
     */
    async clearCatalogStatisticsCache(): Promise<void> {
        await this.catalogStatisticsCache.clear()
    }

    /**
     * Registers a callback that will be called when the catalog statistics change.
     * @returns id of the callback
     */
    registerCatalogStatisticsChangeCallback(callback: () => Promise<void>): string {
        return this.catalogStatisticsCache.registerCatalogStatisticsChangeCallback(callback)
    }

    /**
     * Unregisters the callback that was registered with registerCatalogStatisticsChangeCallback.
     * @param id
     */
    unregisterCatalogStatisticsChangeCallback(id: string): void {
        this.catalogStatisticsCache.unregisterCatalogStatisticsChangeCallback(id)
    }

    /**
     * Returns complete listing of all catalogs known to the Evita instance along with their states and basic statistics.
     */
    async getCatalogStatistics(): Promise<List<CatalogStatistics>> {
        return await this.catalogStatisticsCache.getLatestCatalogStatistics()
    }

    /**
     * Returns catalog with basic statistics.
     */
    async getCatalogStatisticsForCatalog(catalogName: string): Promise<CatalogStatistics> {
        const statistics: CatalogStatistics | undefined = await this.catalogStatisticsCache.getLatestCatalogStatisticsForCatalog(
            catalogName,
            async () => await this.fetchCatalogStatistics()
        )
        if (statistics == undefined) {
            throw new Error(`No catalog statistics found for catalog '${catalogName}'.`)
        }
        return statistics
    }

    /**
     * Returns collection statistics for the specified catalog and entity type.
     */
    async getCollectionStatisticsForCollection(
        catalogName: string,
        entityType: string
    ): Promise<EntityCollectionStatistics> {
        const catalogStatistics: CatalogStatistics = await this.getCatalogStatisticsForCatalog(catalogName)
        const collectionStatistics: EntityCollectionStatistics | undefined = catalogStatistics.entityCollectionStatistics
            .find(it => it.entityType === entityType)
        if (collectionStatistics == undefined) {
            throw new Error(`No collection statistics found for collection '${entityType}' in catalog '${catalogName}'.`)
        }
        return collectionStatistics
    }

    /**
     * Creates a backup of the specified catalog and returns an InputStream to read the binary data of the zip file.
     *
     * @param catalogName   the name of the catalog to backup
     * @param includingWAL  if true, the backup will include the Write-Ahead Log (WAL) file and when the catalog is
     *                      restored, it'll replay the WAL contents locally to bring the catalog to the current state
     * @param pastMoment    leave null for creating backup for actual dataset, or specify past moment to create backup for
     *                      the dataset as it was at that moment
     */
    async backupCatalog(
        catalogName: string,
        pastMoment: OffsetDateTime | undefined,
        includingWAL: boolean
    ): Promise<TaskStatus> {
        return await this.evitaClientProvider().updateCatalog(
            catalogName,
            session => {
                return session.backupCatalog(pastMoment, includingWAL)
            }
        )
    }

    /**
     * Restores a catalog from the provided file which contains the binary data of a previously backed up zip
     * file.
     */
    async restoreCatalog(file: Blob, catalogName: string): Promise<TaskStatus> {
        try {
            const fileReader = new FileReader();
            let offset: number = 0;
            const totalSize: number = file.size;

            // Helper function to read a chunk
            function readChunk() {
                if (offset >= totalSize) {
                    fileReader.abort();
                    return;
                }
                const chunk = file.slice(offset, offset + chunkSize);
                fileReader.readAsArrayBuffer(chunk);
            }

            // Promise to handle the load of one chunk
            const onLoadPromise = () => {
                return new Promise<Uint8Array>((resolve, reject) => {
                    fileReader.onload = (event: ProgressEvent<FileReader>) => {
                        if (event.target?.result) {
                            const arrayBuffer = event.target.result as ArrayBuffer;
                            const fileChunk = new Uint8Array(arrayBuffer);
                            offset += chunkSize;
                            resolve(fileChunk);
                        }
                    };

                    fileReader.onerror = () => {
                        fileReader.abort();
                        reject(new UnexpectedError('Error reading file'));
                    };
                });
            };

            let lastTaskStatus: GrpcTaskStatus | undefined = undefined
            let uploadedFileId: Uuid | undefined = undefined
            while (offset < totalSize) {
                readChunk();
                const chunk: Uint8Array = await onLoadPromise();
                const chunkRequest: GrpcRestoreCatalogUnaryRequest = new GrpcRestoreCatalogUnaryRequest({
                    catalogName,
                    backupFile: chunk,
                    fileId: uploadedFileId != undefined
                        ? {
                            mostSignificantBits: uploadedFileId.mostSignificantBits,
                            leastSignificantBits: uploadedFileId.leastSignificantBits
                        }
                        : undefined,
                    totalSizeInBytes: BigInt(file.size)
                });

                const chunkResponse: GrpcRestoreCatalogUnaryResponse = await this.evitaManagementClientProvider()
                    .restoreCatalogUnary(
                        chunkRequest,
                        { timeoutMs: fileChunkUploadTimeout }
                    )
                lastTaskStatus = chunkResponse.task
                if (uploadedFileId == undefined) {
                    if (chunkResponse.fileId == undefined) {
                        throw new UnexpectedError('No fileId was returned for uploaded chunk. Aborting...')
                    }
                    uploadedFileId = this.evitaValueConverterProvider().convertGrpcUuid(chunkResponse.fileId)
                }
            }

            return this.taskStatusConverterProvider().convert(lastTaskStatus!)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Restores a catalog from the specified server stored file which contains the binary data of a previously backed up zip
     * file.
     */
    async restoreCatalogFromServerFile(fileId: Uuid, catalogName: string): Promise<TaskStatus> {
        try {
            const result = await this.evitaManagementClientProvider()
                .restoreCatalogFromServerFile({
                    catalogName,
                    fileId: {
                        leastSignificantBits: fileId.leastSignificantBits,
                        mostSignificantBits: fileId.mostSignificantBits
                    }
                })
            return this.taskStatusConverterProvider().convert(result.task!)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Returns job statuses for the requested job ids. If the job with the specified jobId is not found, it is not
     * included in the returned collection.
     */
    async listTaskStatuses(
        pageNumber: number,
        pageSize: number,
        taskTypes?: string[],
        states?: TaskState[]
    ): Promise<PaginatedList<TaskStatus>> {
        try {
            const params = states && states.length > 0
                ? this.taskStateConverterProvider().convertTaskStatesToGrpc(states)
                : []
            const result = await this.evitaManagementClientProvider()
                .listTaskStatuses({
                    pageNumber,
                    pageSize,
                    taskType: taskTypes?.map(taskType => StringValue.fromJson(taskType)) || undefined,
                    simplifiedState: params
                })
            return this.taskStatusConverterProvider().convertTaskStatuses(result)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Cancels the job with the specified jobId. If the job is waiting in the queue, it will be removed from the queue.
     * If the job is already running, it must support cancelling to be interrupted and canceled.
     */
    async cancelTask(taskId: Uuid): Promise<boolean> {
        try {
            const result = await this.evitaManagementClientProvider().cancelTask({
                taskId: {
                    leastSignificantBits: taskId.leastSignificantBits,
                    mostSignificantBits: taskId.mostSignificantBits
                }
            })
            return result.success
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Returns list of files that are available for download.
     *
     * @param pageNumber page number (1-based)
     * @param pageSize number of items per page
     * @param origin origin of the files (derived from task type), it filters the returned files to only those that are
     *              related to the specified origin
     */
    async listFilesToFetch(pageNumber: number, pageSize: number, origin: string): Promise<PaginatedList<ServerFile>> {
        try {
            const result = await this.evitaManagementClientProvider()
                .listFilesToFetch({
                    origin,
                    pageNumber,
                    pageSize
                })
            return this.serverFileConverterProvider().convertServerFiles(result)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Fetches contents of the file with the specified fileId to the output blob.
     */
    async fetchFile(fileId: Uuid): Promise<Blob> {
        try {
            const res = this.evitaManagementClientProvider().fetchFile({
                fileId: {
                    leastSignificantBits: fileId.leastSignificantBits,
                    mostSignificantBits: fileId.mostSignificantBits
                }
            })
            const data: Uint8Array[] = []

            for await (const job of res) {
                data.push(job.fileContents)
            }
            return new Blob(data)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Removes file with the specified fileId from the storage.
     */
    async deleteFile(fileId: Uuid): Promise<boolean> {
        try {
            const response: GrpcDeleteFileToFetchResponse = await this.evitaManagementClientProvider()
                .deleteFile({
                    fileId: {
                        leastSignificantBits: fileId.leastSignificantBits,
                        mostSignificantBits: fileId.mostSignificantBits
                    }
                })
            return response.success
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    async isClassifierValid(classifierType: ClassifierType, classifier: string): Promise<ClassifierValidationErrorType | undefined> {
        if (this.reservedKeywords == undefined) {
            try {
                const response: GrpcReservedKeywordsResponse = await this.evitaManagementClientProvider()
                    .listReservedKeywords(Empty)
                this.reservedKeywords = this.reservedKeywordsConverterProvider().convert(response.keywords)
            } catch (e) {
                this.errorTransformer.transformError(e)
            }
        }

        if (classifier.trim().length === 0) {
            return ClassifierValidationErrorType.Empty
        }
        if (classifier !== classifier.trim()) {
            return ClassifierValidationErrorType.LeadingTrailingWhiteSpace
        }
        if (this.isClassifierKeyword(classifierType, classifier)) {
            return ClassifierValidationErrorType.Keyword
        }
        if (!this.classifierFormatPattern.test(classifier)) {
            return ClassifierValidationErrorType.Format
        }

        return undefined
    }

    /**
     * Fetches server status from server represented by the connection
     */
    async getServerStatus(): Promise<ServerStatus> {
        return await this.serverMetadataCache.getLatestServerStatus()
    }

    private async fetchServerStatus(): Promise<ServerStatus> {
        try {
            const grpcServerStatus: GrpcEvitaServerStatusResponse = await this.evitaManagementClientProvider()
                .serverStatus(Empty)
            return this.serverStatusConverterProvider().convert(grpcServerStatus)
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Retrieves the current configuration of the EvitaDB server in String format with evaluated value expressions.
     */
    async getConfiguration(): Promise<string> {
        return await this.serverMetadataCache.getLatestConfiguration()
    }

    private async fetchConfiguration(): Promise<string> {
        try {
            const response: GrpcEvitaConfigurationResponse = await this.evitaManagementClientProvider().getConfiguration(Empty)
            return response.configuration
        } catch (e) {
            throw this.errorTransformer.transformError(e)
        }
    }

    /**
     * Lists all available JFR recording event types.
     */
    async listJfrRecordingEventTypes(): Promise<EventType[]>{
        const result = await ky.get(this.evitaClientProvider().connection.observabilityUrl + '/getRecordingEventTypes')
        return (await result.json()) as EventType[]
    }

    /**
     * Starts a new JFR recording for specified events.
     */
    async startJrfRecording(allowedEvents: string[]):Promise<boolean> {
        const result = await ky.post(this.evitaClientProvider().connection.observabilityUrl + '/startRecording', {
            json: { allowedEvents: allowedEvents }

        })
        return result.ok
    }

    /**
     * Stops the running JFR (Java Flight Recorder) recording.
     *
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the stop recording request was successful.
     */
    async stopJfrRecording():Promise<boolean> {
        return (await ky.post(this.evitaClientProvider().connection.observabilityUrl + '/stopRecording')).ok
    }

    /**
     * Fetches catalog statistics from the server.
     * @private
     */
    private fetchCatalogStatistics = async (): Promise<List<CatalogStatistics>> => {
        try {
            const response: GrpcEvitaCatalogStatisticsResponse = await this.evitaManagementClientProvider().getCatalogStatistics(Empty)
            return List(
                response.catalogStatistics
                    .map((x) => this.catalogStatisticsConverterProvider().convert(x))
            )
        } catch (e: any) {
            throw this.errorTransformer.transformError(e)
        }
    }

    private isClassifierKeyword(classifierType: ClassifierType, classifier: string): boolean {
        if (classifier.trim().length === 0) {
            return false
        }
        const normalizedClassifier: Keyword = new Keyword(
            splitStringWithCaseIntoWords(classifier)
                .map(it => it.toLowerCase())
                .toArray()
        )
        if (this.reservedKeywords == undefined) {
            throw new UnexpectedError('Missing reserved keywords.')
        }
        const reservedKeywords: Immutable.List<Keyword> | undefined = this.reservedKeywords.get(classifierType)
        if (reservedKeywords == undefined) {
            return false
        }
        return reservedKeywords.findIndex(it => it.equals(normalizedClassifier)) > -1
    }
}
