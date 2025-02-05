import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { trafficRecorderTaskName } from '@/modules/traffic-viewer/model/TrafficRecorderTask'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import Immutable from 'immutable'
import { Catalog } from '@/modules/connection/model/Catalog'
import { TrafficRecordingCaptureRequest } from '@/modules/connection/model/traffic/TrafficRecordingCaptureRequest'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import {
    TrafficRecordHistoryVisualisationProcessor
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryVisualisationProcessor'
import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'

export const trafficViewerServiceInjectionKey: InjectionKey<TrafficViewerService> = Symbol('trafficViewerService')

/**
 * Service for traffic recordings related UI
 */
export class TrafficViewerService {

    private readonly connectionService: ConnectionService
    private readonly visualisationProcessor: TrafficRecordHistoryVisualisationProcessor

    constructor(connectionService: ConnectionService, visualisationProcessor: TrafficRecordHistoryVisualisationProcessor) {
        this.connectionService = connectionService
        this.visualisationProcessor = visualisationProcessor
    }

    async getAvailableCatalogs(connection: Connection): Promise<Immutable.List<Catalog>> {
        return this.connectionService.getCatalogs(connection, true)
    }

    async isCatalogExists(connection: Connection, catalogName: string): Promise<boolean> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        try {
            await driver.getCatalog(connection, catalogName)
            return true
        } catch (e) {
            return false
        }
    }

    async getRecordings(connection: Connection, pageNumber: number, pageSize: number): Promise<PaginatedList<ServerFile>> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return await driver.getFilesToFetch(connection, trafficRecorderTaskName, pageNumber, pageSize)
    }

    async startRecording(connection: Connection,
                         catalogName: string,
                         samplingRate: number,
                         maxDurationInMilliseconds: bigint | undefined,
                         exportFile: boolean,
                         maxFileSizeInBytes: bigint | undefined,
                         chunkFileSizeInBytes: bigint | undefined): Promise<TaskStatus> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return await driver.startTrafficRecording(
            connection,
            catalogName,
            samplingRate,
            maxDurationInMilliseconds,
            exportFile,
            maxFileSizeInBytes,
            chunkFileSizeInBytes
        )
    }

    async stopRecording(connection: Connection,
                        trafficRecorderTask: TaskStatus): Promise<TaskStatus> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return await driver.stopTrafficRecording(connection, trafficRecorderTask)
    }

    async getRecordHistoryList(dataPointer: TrafficRecordHistoryDataPointer,
                               captureRequest: TrafficRecordingCaptureRequest,
                               limit: number,
                               reverse: boolean = false): Promise<Immutable.List<TrafficRecord>> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(dataPointer.connection)
        return await driver.getTrafficRecordHistoryList(dataPointer.connection, dataPointer.catalogName, captureRequest, limit, reverse)
    }

    async processRecords(dataPointer: TrafficRecordHistoryDataPointer,
                         historyCriteria: TrafficRecordHistoryCriteria,
                         records: TrafficRecord[]): Promise<Immutable.List<TrafficRecordVisualisationDefinition>> {
        return await this.visualisationProcessor.process(dataPointer, historyCriteria, records)
    }

    async getLabelNames(connection: Connection,
                        catalogName: string,
                        nameStartsWith: string,
                        limit: number): Promise<Immutable.List<string>> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return await driver.getTrafficRecordingLabelNamesOrderedByCardinality(
            connection,
            catalogName,
            nameStartsWith,
            limit
        )
    }

    async getLabelValues(connection: Connection,
                         catalogName: string,
                         labelName: string,
                         valueStartsWith: string,
                         limit: number): Promise<Immutable.List<string>> {
    const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
    return await driver.getTrafficRecordingLabelValuesOrderedByCardinality(
        connection,
        catalogName,
        labelName,
        valueStartsWith,
        limit
    )
}
}

export function useTrafficViewerService(): TrafficViewerService {
    return mandatoryInject(trafficViewerServiceInjectionKey) as TrafficViewerService
}
