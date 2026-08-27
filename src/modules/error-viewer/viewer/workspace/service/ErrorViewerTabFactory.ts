import { LabError } from '@/modules/base/exception/LabError'
import { ErrorViewerTabParams } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParams'
import type { InjectionKey } from 'vue'
import { ErrorViewerTabDefinition } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabDefinition'
import { mandatoryInject } from '@/utils/reactivity'
import { ErrorSummary } from '@/modules/base/exception/ErrorSummary'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { ErrorViewerTabParamsDto } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParamsDto'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'

export const errorViewerTabFactoryInjectionKey: InjectionKey<ErrorViewerTabFactory> = Symbol('errorViewerTabFactory')

/**
 * Creates error viewer tabs, both for a freshly occurred error and for one restored from a previous session or from a
 * shared link.
 */
export class ErrorViewerTabFactory implements TabFactory {

    readonly tabType: TabType = TabType.ErrorViewer
    readonly restorable: boolean = true

    /**
     * Creates new tab definition
     */
    createNew(error: LabError): ErrorViewerTabDefinition {
        return new ErrorViewerTabDefinition(
            error.name,
            new ErrorViewerTabParams(ErrorSummary.fromError(error))
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): ErrorViewerTabDefinition {
        const dto: ErrorViewerTabParamsDto = paramsJson as ErrorViewerTabParamsDto
        const error: ErrorSummary = ErrorSummary.restore(dto.error)

        return new ErrorViewerTabDefinition(
            error.name,
            new ErrorViewerTabParams(error)
        )
    }
}

export const useErrorViewerTabFactory = (): ErrorViewerTabFactory => {
    return mandatoryInject(errorViewerTabFactoryInjectionKey) as ErrorViewerTabFactory
}
