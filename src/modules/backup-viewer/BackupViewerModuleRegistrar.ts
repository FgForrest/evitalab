import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import type { ModuleRegistrar } from "@/ModuleRegistrar";
import { BackupViewerService, backupViewerServiceInjectionKey } from "./service/BackupViewerService";
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class BackupViewerModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const backupViewerService: BackupViewerService = new BackupViewerService(evitaClient)
        builder.provide(backupViewerServiceInjectionKey, backupViewerService)
    }
}
