import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    EvitaQLConsoleService,
    evitaQLConsoleServiceInjectionKey
} from '@/modules/evitaql-console/console/service/EvitaQLConsoleService'
import {
    EvitaDBDriverResolver,
    evitaDBDriverResolverInjectionKey
} from '@/modules/connection/driver/EvitaDBDriverResolver'
import {
    EvitaQLConsoleTabFactory,
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    EvitaQLResultVisualiserService,
    evitaQLResultVisualiserServiceInjectionKey
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class EvitaQLConsoleModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const evitaDBDriverResolver: EvitaDBDriverResolver = builder.inject(evitaDBDriverResolverInjectionKey)

        builder.provide(
            evitaQLConsoleServiceInjectionKey,
            new EvitaQLConsoleService(evitaDBDriverResolver)
        )
        builder.provide(
            evitaQLResultVisualiserServiceInjectionKey,
            new EvitaQLResultVisualiserService(connectionService)
        )
        // todo lho fix circular dep
        // builder.provide(
        //     evitaQLConsoleTabFactoryInjectionKey,
        //     new EvitaQLConsoleTabFactory(connectionService)
        // )
    }
}
