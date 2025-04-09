import { ModuleContextBuilder } from "@/ModuleContextBuilder";
import { ModuleRegistrar } from "@/ModuleRegistrar";
import { BackupViewerService, backupViewerServiceInjectionKey } from "./service/BackupViewerService";
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'

//TODO: docs
export class BackupViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const backupViewerService: BackupViewerService = new BackupViewerService(connectionService)
        builder.provide(backupViewerServiceInjectionKey, backupViewerService)
    }
}
