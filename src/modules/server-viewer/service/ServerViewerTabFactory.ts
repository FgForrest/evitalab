import { Connection } from '@/modules/connection/model/Connection'
import { ServerViewerTabDefinition } from '../model/ServerViewerTabDefinition'
import { ServerViewerTabParams } from '../model/ServerViewerTabParams'
import { mandatoryInject } from '@/utils/reactivity'
import { InjectionKey } from 'vue'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ServerViewerTabParamsDto } from '../model/ServerViewerTabParamsDto'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { i18n } from '@/vue-plugins/i18n'

export const serverViewerTabFactoryInjectionKey: InjectionKey<ServerViewerTabFactory> = Symbol('serverStatusTabFactory')

export class ServerViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection) {
        return new ServerViewerTabDefinition(
            this.constructTitle(connection),
            new ServerViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): ServerViewerTabDefinition {
        const params: ServerViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new ServerViewerTabDefinition(
            this.constructTitle(params.connection),
            params
        )
    }

    private constructTitle(connection: Connection): string {
        return i18n.global.t(
            'serverViewer.definition.title',
            { connectionName: connection.name }
        )
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): ServerViewerTabParams {
        const dto: ServerViewerTabParamsDto = json as ServerViewerTabParamsDto
        return new ServerViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export const useServerStatusTabFactory = (): ServerViewerTabFactory => {
    return mandatoryInject(serverViewerTabFactoryInjectionKey) as ServerViewerTabFactory
}
