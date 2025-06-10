import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class ErrorViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        // todo lho fix circular dep
        // builder.provide(errorViewerTabFactoryInjectionKey, new ErrorViewerTabFactory())
    }
}
