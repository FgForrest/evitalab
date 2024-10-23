import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { LabError } from '@/modules/base/exception/LabError'
import { ErrorViewerTabParamsDto } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParamsDto'

/**
 * Represents props of the LabEditorErrorViewer component.
 */
export class ErrorViewerTabParams implements TabParams<ErrorViewerTabParamsDto> {
    /**
     * Short error message.
     */
    readonly error: LabError

    constructor(error: LabError) {
        this.error = error
    }

    toSerializable(): ErrorViewerTabParamsDto {
        // todo implement
        return {}
    }
}
