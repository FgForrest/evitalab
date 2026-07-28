import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { trafficRecorderTaskName } from '@/modules/traffic-viewer/model/TrafficRecorderTask'
import { trafficRecordingExportTaskName } from '@/modules/traffic-viewer/model/TrafficRecordingExportTask'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { List as ImmutableList } from 'immutable'
import {
    TrafficRecordHistoryVisualisationProcessor
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryVisualisationProcessor'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import {
    TrafficRecordingCaptureRequest
} from '@/modules/database-driver/request-response/traffic-recording/TrafficRecordingCaptureRequest'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'

export const trafficViewerServiceInjectionKey: InjectionKey<TrafficViewerService> = Symbol('trafficViewerService')

/**
 * Service for traffic recordings related UI
 */
export class TrafficViewerService {

    private readonly evitaClient: EvitaClient
    private readonly visualisationProcessor: TrafficRecordHistoryVisualisationProcessor

    constructor(evitaClient: EvitaClient, visualisationProcessor: TrafficRecordHistoryVisualisationProcessor) {
        this.evitaClient = evitaClient
        this.visualisationProcessor = visualisationProcessor
    }

    async getAvailableCatalogs(): Promise<ImmutableList<CatalogStatistics>> {
        // todo lho force reload? it was there before
        return await this.evitaClient.management.getCatalogStatistics()
    }

    async isCatalogExists(catalogName: string): Promise<boolean> {
        return (await this.evitaClient.getCatalogNames()).contains(catalogName)
    }

    async getRecordings(pageNumber: number, pageSize: number): Promise<PaginatedList<ServerFile>> {
        return await this.evitaClient.management.listFilesToFetch(
            pageNumber,
            pageSize,
            [trafficRecorderTaskName, trafficRecordingExportTaskName]
        )
    }

    async startRecording(catalogName: string,
                         samplingRate: number,
                         maxDurationInMilliseconds: bigint | undefined,
                         exportFile: boolean,
                         maxFileSizeInBytes: bigint | undefined,
                         chunkFileSizeInBytes: bigint | undefined): Promise<TaskStatus> {
        return await this.evitaClient.updateCatalog(
            catalogName,
            session => session.startRecording(
                samplingRate,
                exportFile,
                maxDurationInMilliseconds,
                maxFileSizeInBytes,
                chunkFileSizeInBytes
            )
        )
    }

    async stopRecording(trafficRecorderTask: TaskStatus): Promise<TaskStatus> {
        return await this.evitaClient.updateCatalog(
            trafficRecorderTask.catalogName!,
            session => session.stopRecording(trafficRecorderTask.taskId)
        )
    }

    /**
     * Requests an on-demand export of the traffic recording buffer of the passed catalog into a downloadable ZIP
     * archive and returns status of the server task producing it. The export doesn't require a running recording,
     * only an installed rich traffic recorder (enabled in server configuration or an active on-demand recording).
     *
     * @param catalogName name of the catalog whose traffic buffer should be exported
     * @param chunkFileSizeInBytes desired approximate size of the individual chunk files inside the archive,
     *                             leave undefined to use the server default
     */
    async exportTrafficBuffer(catalogName: string,
                              chunkFileSizeInBytes: bigint | undefined): Promise<TaskStatus> {
        return await this.evitaClient.updateCatalog(
            catalogName,
            session => session.exportTrafficRecording(chunkFileSizeInBytes)
        )
    }

    /**
     * Returns current status of a single server task, or undefined if the server doesn't know such task anymore.
     * Used for tracking progress of a started traffic buffer export.
     */
    async getTaskStatus(taskId: Uuid): Promise<TaskStatus | undefined> {
        return await this.evitaClient.management.getTaskStatus(taskId)
    }

    /**
     * Downloads contents of a server file produced by a finished traffic recording export.
     */
    async fetchExportedFile(fileId: Uuid): Promise<Blob> {
        return await this.evitaClient.management.fetchFile(fileId)
    }

    async getRecordHistoryList(catalogName: string,
                               captureRequest: TrafficRecordingCaptureRequest,
                               limit: number,
                               reverse: boolean = false): Promise<ImmutableList<TrafficRecord>> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getRecordings(
                captureRequest,
                limit,
                reverse
            )
        )
    }

    async processRecords(catalogName: string,
                         historyCriteria: TrafficRecordHistoryCriteria,
                         records: TrafficRecord[]): Promise<ImmutableList<TrafficRecordVisualisationDefinition>> {
        return await this.visualisationProcessor.process(catalogName, historyCriteria, records)
    }

    async getLabelNames(catalogName: string,
                        nameStartsWith: string,
                        limit: number): Promise<ImmutableList<string>> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getLabelNamesOrderedByCardinality(
                nameStartsWith,
                limit
            )
        )
    }

    async getLabelValues(catalogName: string,
                         labelName: string,
                         valueStartsWith: string,
                         limit: number): Promise<ImmutableList<string>> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getLabelValuesOrderedByCardinality(
                labelName,
                valueStartsWith,
                limit
            )
        )
    }
}

export function useTrafficViewerService(): TrafficViewerService {
    return mandatoryInject(trafficViewerServiceInjectionKey) as TrafficViewerService
}
