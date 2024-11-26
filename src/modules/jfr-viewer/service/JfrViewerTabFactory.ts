import { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition'
import { JfrViewerTabParams } from '@/modules/jfr-viewer/model/JfrViewerTabParams'
import { mandatoryInject } from '@/utils/reactivity'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { JfrViewerTabParamsDto } from '@/modules/jfr-viewer/model/JfrViewerTabParamsDto'
import { i18n } from '@/vue-plugins/i18n'

export const jfrViewerTabFactoryInjectionKey: InjectionKey<JfrViewerTabFactory> = Symbol('jfrViewerTabFactory');

export class JfrViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection): JfrViewerTabDefinition {
        return new JfrViewerTabDefinition(
            this.constructTitle(connection),
            new JfrViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto):JfrViewerTabDefinition {
        const params: JfrViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new JfrViewerTabDefinition(
            this.constructTitle(params.connection),
            params
        )
    }

    private constructTitle(connection: Connection): string {
        return i18n.global.t(
            'jfrViewer.definition.title',
            { connectionName: connection.name }
        )
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): JfrViewerTabParams {
        const dto: JfrViewerTabParamsDto = json as JfrViewerTabParamsDto
        return new JfrViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export function useJfrViewerTabFactory(): JfrViewerTabFactory {
    return mandatoryInject(jfrViewerTabFactoryInjectionKey) as JfrViewerTabFactory
}
