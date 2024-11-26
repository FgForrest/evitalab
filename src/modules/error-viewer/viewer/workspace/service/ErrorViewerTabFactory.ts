// todo docs
import { LabError } from '@/modules/base/exception/LabError'
import { ErrorViewerTabParams } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParams'
import { InjectionKey } from 'vue'
import { ErrorViewerTabDefinition } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabDefinition'
import { mandatoryInject } from '@/utils/reactivity'

export const errorViewerTabFactoryInjectionKey: InjectionKey<ErrorViewerTabFactory> = Symbol('errorViewerTabFactory')

export class ErrorViewerTabFactory {

    /**
     * Creates new tab definition
     */
    createNew(error: LabError): ErrorViewerTabDefinition {
        return new ErrorViewerTabDefinition(
            error.name,
            new ErrorViewerTabParams(error)
        )
    }
}

export const useErrorViewerTabFactory = (): ErrorViewerTabFactory => {
    return mandatoryInject(errorViewerTabFactoryInjectionKey) as ErrorViewerTabFactory
}
