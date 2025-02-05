import { Catalog } from '@/modules/connection/model/Catalog'
import { Connection } from '@/modules/connection/model/Connection'
import { CatalogSchema } from '@/modules/connection/model/schema/CatalogSchema'
import { Response } from '@/modules/connection/model/data/Response'
import Immutable, { List } from 'immutable'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { ClassifierType } from '@/modules/connection/model/data-type/ClassifierType'
import { OffsetDateTime } from '../model/data-type/OffsetDateTime'
import { Uuid } from '../model/data-type/Uuid'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { CatalogVersionAtResponse } from '@/modules/connection/model/CatalogVersionAtResponse'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { TaskState } from '@/modules/connection/model/task/TaskState'
import { EventType } from '@/modules/connection/model/jfr/EventType'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { TrafficRecordingCaptureRequest } from '@/modules/connection/model/traffic/TrafficRecordingCaptureRequest'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'

/**
 * evitaDB version-agnostic driver to access data from connected evitaDB server
 */
export interface EvitaDBDriver {

    /**
     * Which versions of evitaDB server this driver supports. Can be any string supported by https://www.npmjs.com/package/semver.
     * Comparison is done using the `.satisfies(...)` method
     */
    getSupportedVersions(): List<string>

    /**
     * Closes all open session to specified catalog. Any subsequent call to session
     * will request new session.
     */
    closeAllSessions(connection: Connection, catalogName?: string): void

    /**
     * Returns all available catalogs from server for the given evitaDB connection
     *
     * @param connection connection to evitaDB server
     */
    getCatalogs(connection: Connection): Promise<Catalog[]>

    // todo docs
    getCatalog(connection: Connection, catalogName: string): Promise<Catalog>

    /**
     * Returns schema for a given catalog name from server for the given evitaDB connection
     *
     * @param connection connection to evitaDB server
     * @param catalogName name of catalog for which schema is returned
     */
    getCatalogSchema(connection: Connection, catalogName: string): Promise<CatalogSchema>

    /**
     * Returns list of entities for given query from given catalog for the given evitaDB connection
     *
     * @param connection connection to evitaDB server
     * @param catalogName name of catalog to query
     * @param query query to request entities
     */
    query(connection: Connection, catalogName: string, query: string): Promise<Response>

    // todo use this driver even for GQL etc? it could make sense to differentiate version of gql apis
    // queryGraphQL(connection: Connection, path: string, query: string, variables: any = {}): Promise<GraphQLResponse>

    //TODO: Add doc
    getRuntimeConfiguration(connection: Connection): Promise<string>

    /**
     * Fetches server status from server represented by the connection
     */
    getServerStatus(connection: Connection): Promise<ServerStatus>

    /**
     * Validates a classifier against evitaDB. Returns `undefined` if valid, otherwise returns reason.
     */
    isClassifierValid(connection: Connection, classifierType: ClassifierType, classifier: string): Promise<ClassifierValidationErrorType | undefined>

    //TODO: Add doc
    createCatalog(connection: Connection, catalogName: string): Promise<boolean>
    //TODO: Add doc
    dropCatalog(connection: Connection, catalogName: string): Promise<boolean>
    //TODO: Add doc
    renameCatalog(connection: Connection, catalogName: string, newCatalogName: string): Promise<boolean>
    //TODO: Add doc
    replaceCatalog(connection: Connection, catalogNameToBeReplacedWith: string, catalogNameToBeReplaced: string): Promise<boolean>
    switchCatalogToAliveState(connection: Connection, catalogName: string): Promise<boolean>
//TODO: Add doc
    getMinimalBackupDate(connection: Connection, catalogName: string): Promise<CatalogVersionAtResponse>
    //TODO: Add doc
    createBackup(
        connection: Connection,
        catalogName: string,
        includingWAL: boolean,
        pastMoment: OffsetDateTime | undefined
    ): Promise<TaskStatus>
    //TODO: Add doc
    getFilesToFetch(connection: Connection, origin: string, pageNumber: number, pageSize: number): Promise<PaginatedList<ServerFile>>
    //TODO: Add doc
    getTaskStatuses(
        connection: Connection,
        pageNumber: number,
        pageSize: number,
        states?: TaskState[],
        taskTypes?: string[]
    ): Promise<PaginatedList<TaskStatus>>
    //TODO: Add doc
    restoreCatalogFromServerFile(connection: Connection, fileId: Uuid, catalogName: string): Promise<TaskStatus>
    //TODO: Add doc
    cancelTask(connection: Connection, taskId: Uuid): Promise<boolean>
    //TODO: Add doc
    downloadFile(connection:Connection, fileId: Uuid):Promise<Blob>
    //TODO: Add doc
    restoreCatalog(connection: Connection, file: Blob, catalogName: string): Promise<TaskStatus>
    deleteFile(connection: Connection, fileId: Uuid): Promise<boolean>
    //TODO: Add doc
    downloadRecordingEventTypes(connection: Connection):Promise<EventType[]>
    //TODO: Add doc
    startJrfRecording(connection: Connection, allowedEvents: string[]):Promise<boolean>
    //TODO: Add doc
    stopJfrRecording(connection: Connection):Promise<boolean>
    startTrafficRecording(connection: Connection,
                          catalogName: string,
                          samplingRate: number,
                          maxDurationInMilliseconds: bigint | undefined,
                          exportFile: boolean,
                          maxFileSizeInBytes: bigint | undefined,
                          chunkFileSizeInBytes: bigint | undefined): Promise<TaskStatus>
    stopTrafficRecording(connection: Connection,
                         trafficRecorderTask: TaskStatus): Promise<TaskStatus>
    getTrafficRecordHistoryList(connection: Connection,
                                catalogName: string,
                                captureRequest: TrafficRecordingCaptureRequest,
                                limit: number,
                                reverse?: boolean): Promise<Immutable.List<TrafficRecord>>
    getTrafficRecordingLabelNamesOrderedByCardinality(connection: Connection,
                                                      catalogName: string,
                                                      nameStartsWith: string,
                                                      limit: number): Promise<Immutable.List<string>>
    getTrafficRecordingLabelValuesOrderedByCardinality(connection: Connection,
                                                       catalogName: string,
                                                       labelName: string,
                                                       valueStartsWith: string,
                                                       limit: number): Promise<Immutable.List<string>>

    //TODO: Add doc
    createCollection(connection: Connection, catalogName: string, entityType: string): Promise<void>
    //TODO: Add doc
    renameCollection(connection: Connection, catalogName: string, entityType: string, newName: string): Promise<boolean>
    //TODO: Add doc
    dropCollection(connection: Connection, catalogName: string, entityType: string): Promise<boolean>
}
