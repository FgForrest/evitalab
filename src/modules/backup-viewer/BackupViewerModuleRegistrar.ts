import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import { ModuleRegistrar } from "@/ModuleRegistrar";
import { BackupViewerService, backupViewerServiceInjectionKey } from "./service/BackupViewerService";
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class BackupViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const backupViewerService: BackupViewerService = new BackupViewerService(evitaClient)
        builder.provide(backupViewerServiceInjectionKey, backupViewerService)
    }
}
