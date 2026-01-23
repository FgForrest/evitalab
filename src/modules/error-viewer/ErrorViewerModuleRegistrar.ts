import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class ErrorViewerModuleRegistrar implements ModuleRegistrar {

    register(_builder: ModuleContextBuilder): void {
        void _builder // todo lho fix circular dep
        // builder.provide(errorViewerTabFactoryInjectionKey, new ErrorViewerTabFactory())
    }
}
