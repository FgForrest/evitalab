import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { ErrorSummary } from '@/modules/base/exception/ErrorSummary'
import type { ErrorViewerTabParamsDto } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParamsDto'

/**
 * Represents props of the LabEditorErrorViewer component.
 */
export class ErrorViewerTabParams implements TabParams<ErrorViewerTabParamsDto> {
    /**
     * The reported error. Deliberately the flattened summary and not the original error object, so that the tab can be
     * restored in the next session and shared - see {@link ErrorSummary}.
     */
    readonly error: ErrorSummary

    constructor(error: ErrorSummary) {
        this.error = error
    }

    toSerializable(): ErrorViewerTabParamsDto {
        return {
            error: this.error.toSerializable()
        }
    }
}
