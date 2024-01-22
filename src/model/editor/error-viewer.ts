import { TabRequestComponentParams } from '@/model/editor/editor'
import { LabError } from '@/model/lab'

/**
 * Represents props of the LabEditorErrorViewer component.
 */
export interface ErrorViewerParams extends TabRequestComponentParams {
    /**
     * Short error message.
     */
    readonly error: LabError
}
