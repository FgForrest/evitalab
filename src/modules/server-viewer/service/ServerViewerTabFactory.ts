import { Connection } from '@/modules/connection/model/Connection'
import { ServerViewerTabDefinition } from '../model/ServerViewerTabDefinition'
import { ServerViewerTabParams } from '../model/ServerViewerTabParams'
import { mandatoryInject } from '@/utils/reactivity'
import { InjectionKey } from 'vue'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ServerViewerTabParamsDto } from '../model/ServerViewerTabParamsDto'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'

export const serverViewerTabFactoryInjectionKey: InjectionKey<ServerViewerTabFactory> = Symbol('serverStatusTabFactory')

export class ServerViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection, executeOnOpen: boolean = false) {
        return new ServerViewerTabDefinition(
            this.constructTitle(connection),
            this.createTabParams(connection, executeOnOpen))
    }

    private createTabParams(connection: Connection, executeOnOpen: boolean = false): ServerViewerTabParams {
        return new ServerViewerTabParams(connection, executeOnOpen)
    }

    restoreFromJson(paramsJson: TabParamsDto): ServerViewerTabDefinition {
        // todo lho fix params retore
        const params: ServerViewerTabParamsDto = paramsJson as ServerViewerTabParams
        return new ServerViewerTabDefinition(
            this.constructTitle(params.connection),
            new ServerViewerTabParams(this.connectionService.getConnection(params.connection.id))
        )
    }

    private constructTitle(connection: Connection): string {
        // todo i18n
        return `Server [${connection.name}]`
    }
}

export const useServerStatusTabFactory = (): ServerViewerTabFactory => {
    return mandatoryInject(serverViewerTabFactoryInjectionKey) as ServerViewerTabFactory
}
