import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

/**
 * Registers the error viewer module which displays details of caught errors in a dedicated tab.
 *
 * The module currently provides nothing on its own because its tab factory has to be instantiated by
 * the workspace module, see the note below.
 */
export class ErrorViewerModuleRegistrar implements ModuleRegistrar {

    async register(_builder: ModuleContextBuilder): Promise<void> {
        // todo lho fix circular dep
        // builder.provide(errorViewerTabFactoryInjectionKey, new ErrorViewerTabFactory())
    }
}
