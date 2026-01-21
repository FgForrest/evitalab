import { Connection } from '@/modules/connection/model/Connection'
import { ServerViewerTabDefinition } from '../model/ServerViewerTabDefinition'
import { ServerViewerTabParams } from '../model/ServerViewerTabParams'
import { mandatoryInject } from '@/utils/reactivity'
import type { InjectionKey } from 'vue'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { ServerViewerTabParamsDto } from '../model/ServerViewerTabParamsDto'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { i18n } from '@/vue-plugins/i18n'

export const serverViewerTabFactoryInjectionKey: InjectionKey<ServerViewerTabFactory> = Symbol('serverStatusTabFactory')

export class ServerViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew() {
        const connection: Connection = this.connectionService.getConnection()
        return new ServerViewerTabDefinition(
            this.constructTitle(),
            new ServerViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): ServerViewerTabDefinition {
        const params: ServerViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new ServerViewerTabDefinition(
            this.constructTitle(),
            params
        )
    }

    private constructTitle(): string {
        return i18n.global.t('serverViewer.definition.title')
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): ServerViewerTabParams {
        const dto: ServerViewerTabParamsDto = json as ServerViewerTabParamsDto
        return new ServerViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export const useServerStatusTabFactory = (): ServerViewerTabFactory => {
    return mandatoryInject(serverViewerTabFactoryInjectionKey)
}
