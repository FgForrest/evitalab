import { ModuleRegistrar } from '@/ModuleRegistrar'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { RestClient, restClientInjectionKey } from '@/modules/rest-console/driver/service/RestClient'
import {
    RestConsoleService,
    restConsoleServiceInjectionKey
} from '@/modules/rest-console/console/service/RestConsoleService'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'

// todo lho
export class RestConsoleModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)

        const restClient: RestClient = new RestClient(evitaLabConfig)

        builder.provide(
            restClientInjectionKey,
            restClient
        )
        builder.provide(
            restConsoleServiceInjectionKey,
            new RestConsoleService(restClient, connectionService)
        )
        // todo lho impl
        // builder.provide(
        //     restResultVisualiserServiceInjectionKey,
        //     new RestResultVisualiserService(connectionService)
        // )
        // todo lho fix circular dep
        // builder.provide(
        //     restConsoleTabFactoryInjectionKey,
        //     new RestConsoleTabFactory(connectionService)
        // )
    }
}
