import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import type { ModuleRegistrar } from "@/ModuleRegistrar";
import { BackupViewerService, backupViewerServiceInjectionKey } from "./service/BackupViewerService";
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    BackupViewerTabFactory,
    backupViewerTabFactoryInjectionKey
} from '@/modules/backup-viewer/service/BackupViewerTabFactory'

export class BackupViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const backupViewerTabFactory: BackupViewerTabFactory = new BackupViewerTabFactory(connectionService)
        builder.provide(backupViewerTabFactoryInjectionKey, backupViewerTabFactory)
        tabFactoryRegistry.register(backupViewerTabFactory)

        const backupViewerService: BackupViewerService = new BackupViewerService(evitaClient)
        builder.provide(backupViewerServiceInjectionKey, backupViewerService)
    }
}
