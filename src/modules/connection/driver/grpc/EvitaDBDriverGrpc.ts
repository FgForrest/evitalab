import Immutable, { List } from 'immutable'
import { EvitaDBDriver } from '../EvitaDBDriver'
import { Catalog } from '../../model/Catalog'
import { Connection } from '../../model/Connection'
import { Response } from '../../model/data/Response'
import { CatalogSchema } from '../../model/schema/CatalogSchema'
import { Empty, StringValue } from '@bufbuild/protobuf'
import { CatalogSchemaConverter } from '../grpc/service/CatalogSchemaConverter'
import { CatalogConverter } from '../grpc/service/CatalogConverter'
import { ResponseConverter } from './service/ResponseConverter'
import { Value } from '../../model/Value'
import { EntitySchema } from '../../model/schema/EntitySchema'
import {
    GrpcCatalogSchemaResponse,
    GrpcCatalogVersionAtResponse,
    GrpcDeleteCollectionResponse,
    GrpcGoLiveAndCloseResponse,
    GrpcRenameCollectionResponse
} from '@/modules/connection/driver/grpc/gen/GrpcEvitaSessionAPI_pb'
import { EvitaDBInstanceServerError } from '@/modules/driver-support/exception/EvitaDBInstanceServerError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { TimeoutError } from '../../exception/TimeoutError'
import { EvitaDBInstanceNetworkError } from '@/modules/driver-support/exception/EvitaDBInstanceNetworkError'
import { LabError } from '@/modules/base/exception/LabError'
import { ClientProvider, EvitaSessionClient } from './service/ClientProvider'
import { EntityConverter } from './service/EntityConverter'
import { EvitaValueConverter } from './service/EvitaValueConverter'
import { ExtraResultConverter } from './service/ExtraResultConverter'
import { ServerStatusConverter } from './service/ServerStatusConverter'
import ky from 'ky'
import { OffsetDateTime } from '../../model/data-type/OffsetDateTime'
import { TaskStateConverter } from './service/TaskStateConverter'
import { GrpcDefineCatalogResponse } from '@/modules/connection/driver/grpc/gen/GrpcEvitaAPI_pb'
import { EvitaSessionProvider } from '@/modules/connection/driver/grpc/service/EvitaSessionProvider'
import { ConnectError } from '@connectrpc/connect'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { ClassifierType } from '@/modules/connection/model/data-type/ClassifierType'
import {
    GrpcDeleteFileToFetchResponse,
    GrpcEvitaServerStatusResponse,
    GrpcReservedKeywordsResponse,
    GrpcRestoreCatalogUnaryRequest, GrpcRestoreCatalogUnaryResponse
} from '@/modules/connection/driver/grpc/gen/GrpcEvitaManagementAPI_pb'
import { ReservedKeywordsConverter } from '@/modules/connection/driver/grpc/service/ReservedKeywordsConverter'
import { splitStringWithCaseIntoWords } from '@/utils/string'
import { Keyword } from '@/modules/connection/driver/grpc/model/Keyword'
import { Uuid } from '../../model/data-type/Uuid'
import { TaskStatusConverter } from '@/modules/connection/driver/grpc/service/TaskStatusConverter'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { CatalogVersionAtResponse } from '@/modules/connection/model/CatalogVersionAtResponse'
import { EventType } from '@/modules/connection/model/jfr/EventType'
import { TaskState } from '@/modules/connection/model/task/TaskState'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { ServerFileConverter } from '@/modules/connection/driver/grpc/service/ServerFileConverter'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { GrpcTaskStatus } from '@/modules/connection/driver/grpc/gen/GrpcEvitaDataTypes_pb'

/**
 * Chunk size for upload local backup files
 */
const chunkSize: number = 500 * 1024; // 500 KB chunks
/**
 * Timeout in milliseconds in which a file chunks needs to be uploaded to server
 */
const fileChunkUploadTimeout: number = 60000 // 1 minute

//TODO: Add docs and add header 'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
export class EvitaDBDriverGrpc implements EvitaDBDriver {

    private readonly classifierFormatPattern: RegExp = /^[A-Za-z][A-Za-z0-9_.\-~]{0,254}$/

    private _clientProvider?: ClientProvider
    private _evitaSessionProvider?: EvitaSessionProvider

    private _evitaValueConverter?: EvitaValueConverter
    private _entityConverter?: EntityConverter
    private _extraResultConverter?: ExtraResultConverter
    private _catalogSchemaConverter?: CatalogSchemaConverter
    private _catalogConverter?: CatalogConverter

    private _responseConverter?: ResponseConverter
    private _serverStatusConverter?: ServerStatusConverter
    private _reservedKeywordsConverter?: ReservedKeywordsConverter
    private _taskStateConverter?: TaskStateConverter
    private _serverFileConverter?: ServerFileConverter
    private _taskStatusConverter?: TaskStatusConverter

    private reservedKeywords?: Immutable.Map<ClassifierType, Immutable.List<Keyword>>

    async getCatalogSchema(connection: Connection, catalogName: string): Promise<CatalogSchema> {
        try {
            const schemaRes: GrpcCatalogSchemaResponse =
                await this.evitaSessionProvider.executeInReadOnlySession(
                    connection,
                    await this.getCatalog(connection, catalogName),
                    async (sessionId) => {
                        return await this.clientProvider
                            .getEvitaSessionClient(connection)
                            .getCatalogSchema(
                                { nameVariants: true },
                                {
                                    headers: {
                                        sessionId
                                    }
                                }
                            )
                    }
                )
            if (schemaRes.catalogSchema == null) {
                throw new UnexpectedError(
                    'Catalog schema is missing in gRPC response.'
                )
            }

            return this.catalogSchemaConverter.convert(
                schemaRes.catalogSchema,
                async (
                    catalogName: string
                ): Promise<Value<List<EntitySchema>>> => {
                    return await this.loadEntitySchemas(connection, catalogName)
                }
            )
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }

    private async loadEntitySchemas(
        connection: Connection,
        catalogName: string
    ): Promise<Value<List<EntitySchema>>> {
        try {
            const entitySchemas: EntitySchema[] =
                await this.evitaSessionProvider.executeInReadOnlySession(
                    connection,
                    await this.getCatalog(connection, catalogName),
                    async (sessionId) => {
                        const evitaSessionClient: EvitaSessionClient =
                            this.clientProvider.getEvitaSessionClient(
                                connection
                            )

                        const entityTypesResponse =
                            await evitaSessionClient.getAllEntityTypes(Empty, {
                                headers: {
                                    sessionId
                                }
                            })

                        const entitySchemas: EntitySchema[] = []
                        const entityTypes = entityTypesResponse.entityTypes
                        for (const type of entityTypes) {
                            const entitySchemaResult =
                                await evitaSessionClient.getEntitySchema(
                                    {
                                        nameVariants: true,
                                        entityType: type
                                    },
                                    {
                                        headers: {
                                            sessionId
                                        }
                                    }
                                )
                            const schema = entitySchemaResult.entitySchema
                            if (schema != null) {
                                entitySchemas.push(
                                    this.catalogSchemaConverter.convertEntitySchema(
                                        schema
                                    )
                                )
                            }
                        }

                        return entitySchemas
                    }
                )

            return Value.of(List(entitySchemas))
        } catch (e) {
            throw this.handleCallError(e, connection)
        }
    }

    async query(
        connection: Connection,
        catalogName: string,
        query: string
    ): Promise<Response> {
        try {
            const queryResponse =
                await this.evitaSessionProvider.executeInReadOnlySession(
                    connection,
                    await this.getCatalog(connection, catalogName),
                    async (sessionId) => {
                        return await this.clientProvider
                            .getEvitaSessionClient(connection)
                            .queryUnsafe(
                                {
                                    query
                                },
                                {
                                    headers: {
                                        sessionId
                                    }
                                }
                            )
                    }
                )
            return this.responseConverter.convert(queryResponse)
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }

    async getCatalogs(connection: Connection): Promise<Catalog[]> {
        try {
            const res = (
                await this.clientProvider
                    .getEvitaManagementClient(connection)
                    .getCatalogStatistics(Empty)
            ).catalogStatistics
            return res.map((x) => this.catalogConverter.convert(x))
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }

    async getCatalog(
        connection: Connection,
        catalogName: string
    ): Promise<Catalog> {
        const catalogs: Catalog[] = await this.getCatalogs(connection)
        const catalog: Catalog | undefined = catalogs.find(
            (it) => it.name === catalogName
        )
        if (catalog == undefined) {
            throw new UnexpectedError(`No catalog '${catalogName}' found.`)
        }
        return catalog
    }

    getSupportedVersions(): List<string> {
        return List(['all'])
    }

    async getRuntimeConfiguration(connection: Connection): Promise<string> {
        return (
            await this.clientProvider
                .getEvitaManagementClient(connection)
                .getConfiguration(Empty)
        ).configuration
    }

    async getServerStatus(connection: Connection): Promise<ServerStatus> {
        const grpcServerStatus: GrpcEvitaServerStatusResponse = await this.clientProvider
            .getEvitaManagementClient(connection)
            .serverStatus(Empty)
        return this.serverStatusConverter.convert(grpcServerStatus)
    }

    async isClassifierValid(connection: Connection, classifierType: ClassifierType, classifier: string): Promise<ClassifierValidationErrorType | undefined> {
        if (this.reservedKeywords == undefined) {
            try {
                const response: GrpcReservedKeywordsResponse = await this.clientProvider.getEvitaManagementClient(connection)
                    .listReservedKeywords(Empty)
                this.reservedKeywords = this.reservedKeywordsConverter.convert(response.keywords)
            } catch (e) {
                this.handleCallError(e, connection)
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

    async createCatalog(
        connection: Connection,
        catalogName: string
    ): Promise<boolean> {
        try {
            const catalogResponse: GrpcDefineCatalogResponse =
                await this.clientProvider
                    .getEvitaClient(connection)
                    .defineCatalog({ catalogName })

            return catalogResponse.success
        } catch (e) {
            throw this.handleCallError(e, connection)
        }
    }

    async dropCatalog(
        connection: Connection,
        catalogName: string
    ): Promise<boolean> {
        const response = await this.clientProvider
            .getEvitaClient(connection)
            .deleteCatalogIfExists({
                catalogName
            })
        return response.success
    }

    async renameCatalog(
        connection: Connection,
        catalogName: string,
        newCatalogName: string
    ): Promise<boolean> {
        const response = await this.clientProvider
            .getEvitaClient(connection)
            .renameCatalog({
                catalogName,
                newCatalogName
            })
        return response.success
    }

    async replaceCatalog(
        connection: Connection,
        catalogNameToBeReplacedWith: string,
        catalogNameToBeReplaced: string
    ): Promise<boolean> {
        const response = await this.clientProvider
            .getEvitaClient(connection)
            .replaceCatalog({
                catalogNameToBeReplacedWith,
                catalogNameToBeReplaced
            })
        return response.success
    }

    async switchCatalogToAliveState(connection: Connection, catalogName: string): Promise<boolean> {
        return this.evitaSessionProvider.executeInReadWriteSession(
            connection,
            await this.getCatalog(connection, catalogName),
            async (sessionId) => {
                const response: GrpcGoLiveAndCloseResponse = await this.clientProvider
                    .getEvitaSessionClient(connection)
                    .goLiveAndClose(
                        Empty,
                        {
                            headers: {
                                sessionId
                            }
                        }
                    )
                return response.success
            }
        )
    }

    async createCollection(
        connection: Connection,
        catalogName: string,
        entityType: string
    ): Promise<void> {
        return this.evitaSessionProvider.executeInReadWriteSession(
            connection,
            await this.getCatalog(connection, catalogName),
            async (sessionId) => {
                await this.clientProvider
                    .getEvitaSessionClient(connection)
                    .defineEntitySchema(
                        {
                            entityType,
                        },
                        {
                            headers: {
                                sessionId
                            },
                        }
                    )
            }
        )
    }

    async renameCollection(
        connection: Connection,
        catalogName: string,
        entityType: string,
        newName: string
    ): Promise<boolean> {
        return await this.evitaSessionProvider.executeInReadWriteSession(
            connection,
            await this.getCatalog(connection, catalogName),
            async (sessionId) => {
                const response: GrpcRenameCollectionResponse = await this.clientProvider
                    .getEvitaSessionClient(connection)
                    .renameCollection(
                        {
                            entityType,
                            newName
                        },
                        {
                            headers: {
                                sessionId
                            }
                        }
                    )

                return response.renamed
            }
        )
    }

    async dropCollection(
        connection: Connection,
        catalogName: string,
        entityType: string
    ): Promise<boolean> {
        return await this.evitaSessionProvider.executeInReadWriteSession(
            connection,
            await this.getCatalog(connection, catalogName),
            async (sessionId) => {
                const response: GrpcDeleteCollectionResponse =
                    await this.clientProvider
                        .getEvitaSessionClient(connection)
                        .deleteCollection(
                            {
                                entityType
                            },
                            {
                                headers: {
                                    sessionId
                                }
                            }
                        )

                return response.deleted
            }
        )
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

    async createBackup(
        connection: Connection,
        catalogName: string,
        includingWAL: boolean,
        pastMoment: OffsetDateTime | undefined
    ): Promise<TaskStatus> {
        const res = await this.clientProvider
            .getEvitaClient(connection)
            .createReadWriteSession({ catalogName })
        const result = await this.clientProvider
            .getEvitaSessionClient(connection)
            .backupCatalog(
                {
                    includingWAL,
                    pastMoment: pastMoment != undefined
                        ? {
                            offset: pastMoment.offset,
                            timestamp: pastMoment.timestamp
                        }
                        : undefined,
                },
                {
                    headers: {
                        sessionId: res.sessionId
                    }
                }
            )
        return this.taskStatusConverter.convert(result.taskStatus!)
    }

    async getMinimalBackupDate(
        connection: Connection,
        catalogName: string
    ): Promise<CatalogVersionAtResponse> {
        const res = await this.clientProvider
            .getEvitaClient(connection)
            .createReadOnlySession({ catalogName })
        const result: GrpcCatalogVersionAtResponse = await this.clientProvider
            .getEvitaSessionClient(connection)
            .getCatalogVersionAt(
                {},
                {
                    headers: {
                        sessionId: res.sessionId
                    }
                }
            )
        return new CatalogVersionAtResponse(
            result.version,
            new OffsetDateTime(
                result.introducedAt!.timestamp!,
                result.introducedAt!.offset
            )
        )
    }

    async getFilesToFetch(connection: Connection, origin: string, pageNumber: number, pageSize: number): Promise<PaginatedList<ServerFile>> {
        const result = await this.clientProvider
            .getEvitaManagementClient(connection)
            .listFilesToFetch({
                origin,
                pageNumber,
                pageSize
            })
        return this.serverFileConverter.convertServerFiles(result)
    }

    async getTaskStatuses(
        connection: Connection,
        pageNumber: number,
        pageSize: number,
        states?: TaskState[],
        taskTypes?: string[]
    ): Promise<PaginatedList<TaskStatus>> {
        const params = states && states.length > 0
            ? this.taskStateConverter.convertTaskStatesToGrpc(states)
            : []
        const result = await this.clientProvider
            .getEvitaManagementClient(connection)
            .listTaskStatuses({
                pageNumber,
                pageSize,
                taskType: taskTypes?.map(taskType => StringValue.fromJson(taskType)) || undefined,
                simplifiedState: params
            })
        return this.taskStatusConverter.convertTaskStatuses(result)
    }

    async stopJfrRecording(connection: Connection):Promise<boolean> {
        return (await ky.post(connection.observabilityUrl + '/stopRecording')).ok
    }

    async downloadFile(connection: Connection, fileId: Uuid): Promise<Blob> {
        const res = this.clientProvider.getEvitaManagementClient(connection).fetchFile({
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
    }

    async restoreCatalog(connection: Connection, file: Blob, catalogName: string): Promise<TaskStatus> {
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

            const chunkResponse: GrpcRestoreCatalogUnaryResponse = await this.clientProvider
                .getEvitaManagementClient(connection)
                .restoreCatalogUnary(
                    chunkRequest,
                    { timeoutMs: fileChunkUploadTimeout }
                )
            lastTaskStatus = chunkResponse.task
            if (uploadedFileId == undefined) {
                if (chunkResponse.fileId == undefined) {
                    throw new UnexpectedError('No fileId was returned for uploaded chunk. Aborting...')
                }
                uploadedFileId = this.evitaValueConverter.convertUUID(chunkResponse.fileId)
            }
        }

        return this.taskStatusConverter.convert(lastTaskStatus!)
    }

    async deleteFile(connection: Connection, fileId: Uuid): Promise<boolean> {
        const response: GrpcDeleteFileToFetchResponse = await this.clientProvider.getEvitaManagementClient(connection)
            .deleteFile({
                fileId: {
                    leastSignificantBits: fileId.leastSignificantBits,
                    mostSignificantBits: fileId.mostSignificantBits
                }
            })
        return response.success
    }

    async downloadRecordingEventTypes(connection: Connection):Promise<EventType[]>{
        const result = await ky.get(connection.observabilityUrl + '/getRecordingEventTypes')
        return (await result.json()) as EventType[]
    }

    async startJrfRecording(connection: Connection, allowedEvents: string[]):Promise<boolean> {
        const result = await ky.post(connection.observabilityUrl + '/startRecording', {
            json: { allowedEvents: allowedEvents }

        })
        return result.ok
    }

    async restoreCatalogFromServerFile(
        connection: Connection,
        fileId: Uuid,
        catalogName: string
    ): Promise<TaskStatus> {
        const result = await this.clientProvider
            .getEvitaManagementClient(connection)
            .restoreCatalogFromServerFile({
                catalogName,
                fileId: {
                    leastSignificantBits: fileId.leastSignificantBits,
                    mostSignificantBits: fileId.mostSignificantBits
                }
            })
        return this.taskStatusConverter.convert(result.task!)
    }

    async cancelTask(connection: Connection, taskId: Uuid): Promise<boolean> {
        const result = await this.clientProvider.getEvitaManagementClient(connection).cancelTask({
            taskId: {
                leastSignificantBits: taskId.leastSignificantBits,
                mostSignificantBits: taskId.mostSignificantBits
            }
        })
        return result.success
    }


    private get evitaValueConverter(): EvitaValueConverter {
        if (this._evitaValueConverter == undefined) {
            this._evitaValueConverter = new EvitaValueConverter()
        }
        return this._evitaValueConverter
    }

    private get entityConverter(): EntityConverter {
        if (this._entityConverter == undefined) {
            this._entityConverter = new EntityConverter(this.evitaValueConverter)
        }
        return this._entityConverter
    }

    private get extraResultConverter(): ExtraResultConverter {
        if (this._extraResultConverter == undefined) {
            this._extraResultConverter = new ExtraResultConverter(this.entityConverter)
        }
        return this._extraResultConverter
    }

    private get catalogSchemaConverter(): CatalogSchemaConverter {
        if (this._catalogSchemaConverter == undefined) {
            this._catalogSchemaConverter = new CatalogSchemaConverter(this.evitaValueConverter)
        }
        return this._catalogSchemaConverter
    }

    private get catalogConverter(): CatalogConverter {
        if (this._catalogConverter == undefined) {
            this._catalogConverter = new CatalogConverter()
        }
        return this._catalogConverter
    }

    private get responseConverter(): ResponseConverter {
        if (this._responseConverter == undefined) {
            this._responseConverter = new ResponseConverter(this.entityConverter, this.extraResultConverter)
        }
        return this._responseConverter
    }

    private get serverStatusConverter(): ServerStatusConverter {
        if (this._serverStatusConverter == undefined) {
            this._serverStatusConverter = new ServerStatusConverter(this.evitaValueConverter)
        }
        return this._serverStatusConverter
    }

    private get clientProvider(): ClientProvider {
        if (this._clientProvider == undefined) {
            this._clientProvider = new ClientProvider()
        }
        return this._clientProvider
    }

    private get evitaSessionProvider(): EvitaSessionProvider {
        if (this._evitaSessionProvider == undefined) {
            this._evitaSessionProvider = new EvitaSessionProvider(this.clientProvider)
        }
        return this._evitaSessionProvider
    }

    private get reservedKeywordsConverter(): ReservedKeywordsConverter {
        if (this._reservedKeywordsConverter == undefined) {
            this._reservedKeywordsConverter = new ReservedKeywordsConverter()
        }
        return this._reservedKeywordsConverter
    }

    private get taskStateConverter(): TaskStateConverter {
        if (this._taskStateConverter == undefined) {
            this._taskStateConverter = new TaskStateConverter()
        }
        return this._taskStateConverter
    }

    private get serverFileConverter(): ServerFileConverter {
        if (this._serverFileConverter == undefined) {
            this._serverFileConverter = new ServerFileConverter()
        }
        return this._serverFileConverter
    }
    private get taskStatusConverter(): TaskStatusConverter {
        if (this._taskStatusConverter == undefined) {
            this._taskStatusConverter = new TaskStatusConverter(
                this.taskStateConverter,
                this.serverFileConverter
            )
        }
        return this._taskStatusConverter
    }

    private handleCallError(e: any, connection?: Connection): LabError {
        if (e instanceof ConnectError) {
            return new UnexpectedError(`${e.code}: ${e.message}`)
        } else if (e.name === 'HTTPError') {
            const statusCode: number = e.response.status
            if (statusCode >= 500) {
                return new EvitaDBInstanceServerError(connection)
            } else {
                return new UnexpectedError(e.message)
            }
        } else if (e.name === 'TimeoutError') {
            return new TimeoutError(connection)
        } else if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            return new EvitaDBInstanceNetworkError(connection)
        } else {
            return new UnexpectedError(e.message)
        }
    }
}
