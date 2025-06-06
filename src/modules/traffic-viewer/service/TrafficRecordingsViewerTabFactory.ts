import { i18n } from '@/vue-plugins/i18n'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import {
    TrafficRecordingsViewerTabDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabDefinition'
import { TrafficRecordingsViewerTabParams } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabParams'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TrafficRecordingsViewerTabParamsDto } from '@/modules/traffic-viewer/model/TrafficRecordingsViewerTabParamsDto'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const trafficRecordingsViewerTabFactoryInjectionKey: InjectionKey<TrafficRecordingsViewerTabFactory> = Symbol('trafficViewerTabFactory')

export class TrafficRecordingsViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(): TrafficRecordingsViewerTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new TrafficRecordingsViewerTabDefinition(
            this.constructTitle(),
            new TrafficRecordingsViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): TrafficRecordingsViewerTabDefinition {
        const params: TrafficRecordingsViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new TrafficRecordingsViewerTabDefinition(
            this.constructTitle(),
            params
        )
    }

    private constructTitle(): string {
        return i18n.global.t('trafficViewer.recordings.definition.title')
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): TrafficRecordingsViewerTabParams {
        const dto: TrafficRecordingsViewerTabParamsDto = json as TrafficRecordingsViewerTabParamsDto
        return new TrafficRecordingsViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export function useTrafficRecordingsViewerTabFactory(): TrafficRecordingsViewerTabFactory {
    return mandatoryInject(trafficRecordingsViewerTabFactoryInjectionKey) as TrafficRecordingsViewerTabFactory
}
