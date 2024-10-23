import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    ErrorViewerTabFactory,
    errorViewerTabFactoryInjectionKey
} from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class ErrorViewerModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        builder.provide(errorViewerTabFactoryInjectionKey, new ErrorViewerTabFactory())
    }
}
