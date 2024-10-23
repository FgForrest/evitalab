import { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaDBDriverResolver, evitaDBDriverResolverInjectionKey } from '../connection/driver/EvitaDBDriverResolver'
import {
    ServerViewerService,
    serverViewerServiceInjectionKey
} from '@/modules/server-viewer/service/ServerViewerService'

// todo docs
export class ServerViewerModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const evitaDBDriverResolver: EvitaDBDriverResolver = builder.inject(evitaDBDriverResolverInjectionKey)
        const serverViewerService: ServerViewerService = new ServerViewerService(evitaDBDriverResolver)
        builder.provide(serverViewerServiceInjectionKey, serverViewerService)
    }
}
