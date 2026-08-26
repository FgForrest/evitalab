import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    ErrorViewerTabFactory,
    errorViewerTabFactoryInjectionKey
} from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'

/**
 * Registers the error viewer module which displays details of caught errors in a dedicated tab.
 */
export class ErrorViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const errorViewerTabFactory: ErrorViewerTabFactory = new ErrorViewerTabFactory()
        builder.provide(errorViewerTabFactoryInjectionKey, errorViewerTabFactory)
        tabFactoryRegistry.register(errorViewerTabFactory)
    }
}
