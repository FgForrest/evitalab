import Immutable from 'immutable'
import { EditorSelection } from '@/modules/workspace/status-bar/model/editor-status/EditorSelection'

/**
 * Hold status info about active editor, i.e. editor which is being written in.
 */
export class EditorInfo {
    readonly language: string
    readonly tabSize: number
    selections: Immutable.List<EditorSelection>

    constructor(language: string, tabSize: number) {
        this.language = language
        this.tabSize = tabSize
        this.selections = Immutable.List()
    }
}

