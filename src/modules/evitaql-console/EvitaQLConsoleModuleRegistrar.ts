import type { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    EvitaQLConsoleService,
    evitaQLConsoleServiceInjectionKey
} from '@/modules/evitaql-console/console/service/EvitaQLConsoleService'
import {
    EvitaQLResultVisualiserService,
    evitaQLResultVisualiserServiceInjectionKey
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

// todo docs
export class EvitaQLConsoleModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)

        builder.provide(
            evitaQLConsoleServiceInjectionKey,
            new EvitaQLConsoleService(evitaClient)
        )
        builder.provide(
            evitaQLResultVisualiserServiceInjectionKey,
            new EvitaQLResultVisualiserService(evitaClient)
        )
        // todo lho fix circular dep
        // builder.provide(
        //     evitaQLConsoleTabFactoryInjectionKey,
        //     new EvitaQLConsoleTabFactory(connectionService)
        // )
    }
}
