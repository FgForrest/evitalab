import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EditorInfo } from '@/modules/workspace/status-bar/model/editor-status/EditorInfo'
import Immutable from 'immutable'
import { EditorSelection } from '@/modules/workspace/status-bar/model/editor-status/EditorSelection'

/**
 * Holds all active editor statues
 */
export class EditorStatus {

    _activatedEditorId: string | undefined

    readonly availableEditorInfos: Map<string, EditorInfo> = new Map()

    constructor() {
    }

    /**
     * Activates a defined editor info.
     * Should be called by an editor when it gains focus.
     */
    activateEditor(id: string): void {
        this._activatedEditorId = id
    }

    /**
     * Deactivates currently activated editor. Should be called by an editor
     * when it loses focus.
     */
    deactivateEditor(id: string): void {
        if (this._activatedEditorId === id) {
            this._activatedEditorId = undefined
        }
    }

    /**
     * Returns info of activated editor, if any.
     */
    get activatedEditorInfo(): EditorInfo | undefined {
        if (this._activatedEditorId == undefined) {
            return undefined
        }
        return this.availableEditorInfos.get(this._activatedEditorId)
    }

    /**
     * Activates a new status for currently active editor.
     * Should be called by an editor when it gains focus.
     *
     * @param id editor id
     * @param language editor language configuration
     * @param tabSize editor tab size configuration
     */
    defineEditorInfo(id: string, editorInfo: EditorInfo): void {
        if (this.availableEditorInfos.has(id)) {
            throw new UnexpectedError(`There is already defined editor info under ${id}`)
        }
        this.availableEditorInfos.set(id, editorInfo)
    }

    /**
     * Updates data for currently active editor. Should be called for every
     * editor change.
     *
     * @param id editor id
     * @param newSelections new selections in the active editor
     */
    updateEditorInfo(id: string, newSelections: Immutable.List<EditorSelection>): void {
        const editorInfo: EditorInfo | undefined = this.availableEditorInfos.get(id)
        if (editorInfo == undefined) {
            throw new UnexpectedError(`There is no defined editor under id ${id}`)
        }
        editorInfo.selections = newSelections
    }

    /**
     * Deletes editor info. Should be called when an editor is destroyed.
     *
     * @param id editor id
     */
    deleteEditorInfo(id: string): void {
        this.availableEditorInfos.delete(id)
    }
}
