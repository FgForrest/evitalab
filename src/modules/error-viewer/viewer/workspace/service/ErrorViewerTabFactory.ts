
import { LabError } from '@/modules/base/exception/LabError'
import { ErrorViewerTabParams } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParams'
import type { InjectionKey } from 'vue'
import { ErrorViewerTabDefinition } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabDefinition'
import { mandatoryInject } from '@/utils/reactivity'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

export const errorViewerTabFactoryInjectionKey: InjectionKey<ErrorViewerTabFactory> = Symbol('errorViewerTabFactory')

export class ErrorViewerTabFactory implements TabFactory {

    readonly tabType: TabType = TabType.ErrorViewer
    readonly restorable: boolean = false

    /**
     * Creates new tab definition
     */
    createNew(error: LabError): ErrorViewerTabDefinition {
        return new ErrorViewerTabDefinition(
            error.name,
            new ErrorViewerTabParams(error)
        )
    }

    /**
     * An error tab presents a runtime error that has no meaning outside the session it occurred in,
     * therefore it is never serialized.
     */
    restoreFromJson(): ErrorViewerTabDefinition {
        throw new UnexpectedError(`Tab type '${this.tabType}' cannot be restored.`)
    }
}

export const useErrorViewerTabFactory = (): ErrorViewerTabFactory => {
    return mandatoryInject(errorViewerTabFactoryInjectionKey) as ErrorViewerTabFactory
}
