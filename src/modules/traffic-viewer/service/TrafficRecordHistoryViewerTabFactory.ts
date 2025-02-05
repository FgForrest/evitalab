import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { TrafficRecordHistoryViewerTabData } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabData'
import {
    TrafficRecordHistoryViewerTabDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDefinition'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { TrafficRecordHistoryViewerTabParams } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabParams'
import {
    TrafficRecordHistoryViewerTabParamsDto
} from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabParamsDto'
import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'
import {
    TrafficRecordHistoryViewerTabDataDto
} from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabDataDto'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { Duration } from 'luxon'
import { OffsetDateTime, Timestamp } from '@/modules/connection/model/data-type/OffsetDateTime'

export const trafficRecordHistoryViewerTabFactoryInjectionKey: InjectionKey<TrafficRecordHistoryViewerTabFactory> = Symbol('trafficRecordingHistoryViewerTabFactory')

export class TrafficRecordHistoryViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection,
              catalogName: string,
              initialData: TrafficRecordHistoryViewerTabData | undefined = undefined): TrafficRecordHistoryViewerTabDefinition {
        return new TrafficRecordHistoryViewerTabDefinition(
            this.constructTitle(connection, catalogName),
            this.createNewTabParams(connection, catalogName),
            initialData != undefined ? initialData : new TrafficRecordHistoryViewerTabData(),
        )
    }

    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): TrafficRecordHistoryViewerTabDefinition {
        const params: TrafficRecordHistoryViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        const data: TrafficRecordHistoryViewerTabData = this.restoreTabDataFromSerializable(dataJson)

        return new TrafficRecordHistoryViewerTabDefinition(
            this.constructTitle(
                params.dataPointer.connection,
                params.dataPointer.catalogName,
            ),
            params,
            data
        )
    }

    private constructTitle(connection: Connection, catalogName: string): string {
        return `${catalogName} [${connection.name}]`
    }

    private createNewTabParams(connection: Connection, catalogName: string): TrafficRecordHistoryViewerTabParams {
        return new TrafficRecordHistoryViewerTabParams(
            new TrafficRecordHistoryDataPointer(
                connection,
                catalogName
            )
        )
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): TrafficRecordHistoryViewerTabParams {
        const dto: TrafficRecordHistoryViewerTabParamsDto = json as TrafficRecordHistoryViewerTabParamsDto
        return new TrafficRecordHistoryViewerTabParams(
            new TrafficRecordHistoryDataPointer(
                this.connectionService.getConnection(dto.connectionId),
                dto.catalogName
            )
        )
    }

    private restoreTabDataFromSerializable(json?: TabDataDto): TrafficRecordHistoryViewerTabData {
        if (json == undefined) {
            return new TrafficRecordHistoryViewerTabData()
        }
        const dto: TrafficRecordHistoryViewerTabDataDto = json as TrafficRecordHistoryViewerTabDataDto
        return new TrafficRecordHistoryViewerTabData(
            dto.since != undefined
                ? new OffsetDateTime(
                    new Timestamp(BigInt(dto.since.seconds), dto.since.nanos),
                    dto.since.offset
                )
                : undefined,
            dto.types,
            dto.sessionId != undefined ? Uuid.fromCode(dto.sessionId) : undefined,
            dto.longerThanMillisecondsInHumanFormat,
            dto.fetchingMoreBytesThanInHumanFormat,
            dto.labels
        )
    }
}

export function useTrafficRecordHistoryViewerTabFactory(): TrafficRecordHistoryViewerTabFactory {
    return mandatoryInject(trafficRecordHistoryViewerTabFactoryInjectionKey) as TrafficRecordHistoryViewerTabFactory
}
