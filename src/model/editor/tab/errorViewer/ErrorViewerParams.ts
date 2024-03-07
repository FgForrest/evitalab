import { LabError } from '@/model/lab'
import { TabRequestComponentParams } from '@/model/editor/tab/TabRequestComponentParams'
import { ErrorViewerParamsDto } from '@/model/editor/tab/errorViewer/ErrorViewerParamsDto'

/**
 * Represents props of the LabEditorErrorViewer component.
 */
export class ErrorViewerParams implements TabRequestComponentParams<ErrorViewerParamsDto> {
    /**
     * Short error message.
     */
    readonly error: LabError

    constructor(error: LabError) {
        this.error = error
    }

    toSerializable(): ErrorViewerParamsDto {
        // todo implement
        return {}
    }
}
