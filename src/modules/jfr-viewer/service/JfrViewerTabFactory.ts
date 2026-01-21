import type { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition'
import { JfrViewerTabParams } from '@/modules/jfr-viewer/model/JfrViewerTabParams'
import { mandatoryInject } from '@/utils/reactivity'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { JfrViewerTabParamsDto } from '@/modules/jfr-viewer/model/JfrViewerTabParamsDto'
import { i18n } from '@/vue-plugins/i18n'

export const jfrViewerTabFactoryInjectionKey: InjectionKey<JfrViewerTabFactory> = Symbol('jfrViewerTabFactory');

export class JfrViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(): JfrViewerTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new JfrViewerTabDefinition(
            this.constructTitle(),
            new JfrViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto):JfrViewerTabDefinition {
        const params: JfrViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new JfrViewerTabDefinition(
            this.constructTitle(),
            params
        )
    }

    private constructTitle(): string {
        return i18n.global.t('jfrViewer.definition.title')
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): JfrViewerTabParams {
        const dto: JfrViewerTabParamsDto = json as JfrViewerTabParamsDto
        return new JfrViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export function useJfrViewerTabFactory(): JfrViewerTabFactory {
    return mandatoryInject(jfrViewerTabFactoryInjectionKey)
}
