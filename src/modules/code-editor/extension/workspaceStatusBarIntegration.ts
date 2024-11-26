import { EditorView } from 'codemirror'
import { AnnotationType, Extension, Line, StateField, Annotation, EditorState } from '@codemirror/state'
import { ViewPlugin, ViewUpdate } from '@codemirror/view'
import Immutable from 'immutable'
import { language, Language } from '@codemirror/language'
import { jsonLanguage } from '@codemirror/lang-json'
import { evitaQLQueryLanguage, evitaQLConstraintListLanguage } from '@lukashornych/codemirror-lang-evitaql'
import { graphqlLanguage } from 'cm6-graphql'
import { xmlLanguage } from '@codemirror/lang-xml'
import { yamlLanguage } from '@codemirror/lang-yaml'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { EditorSelection } from '@/modules/workspace/status-bar/model/editor-status/EditorSelection'
import { v4 as uuidv4 } from 'uuid'
import { EditorInfo } from '@/modules/workspace/status-bar/model/editor-status/EditorInfo'

/**
 * Resolves editor language. It is kind of a hack because CodeMirror doesn't
 * provide way to name language extensions.
 */
function resolveLanguageCode(view: EditorView): string {
    const currentLanguage: Language | null = view.state.facet(language)
    let languageCode: string = 'plain'
    if (currentLanguage === jsonLanguage) {
        languageCode = 'JSON'
    } else if (currentLanguage === yamlLanguage) {
        languageCode = 'YAML'
    } else if (currentLanguage === xmlLanguage) {
        languageCode = 'XML'
    } else if (currentLanguage === evitaQLQueryLanguage) {
        languageCode = 'evitaQL'
    } else if (currentLanguage === evitaQLConstraintListLanguage) {
        languageCode = 'evitaQL (constraint mode)'
    } else if (currentLanguage === graphqlLanguage) {
        languageCode = 'GraphQL'
    }
    return languageCode
}

/**
 * Integration of global workspace status bar for an editor. It injects
 * info into the global workspace status bar if the editor is active.
 *
 * @param workspaceService workspace service instance to access status bar API
 */
export function workspaceStatusBarIntegration(workspaceService: WorkspaceService): Extension[] {
    const editorRegisteredAnnotation: AnnotationType<string> = Annotation.define<string>()

    const editorRegistrationIdField: StateField<string | undefined> = StateField.define<string | undefined>({
        create() { return undefined },
        update(value, tr) {
            const editorRegistrationId: string | undefined = tr.annotation<string>(editorRegisteredAnnotation)
            if (editorRegistrationId != null) {
                return editorRegistrationId
            } else {
                return value
            }
        }
    })

    const lifecycleHandler: Extension = EditorView.domEventObservers({
        focus(event, view) {
            if (view.state.field(editorRegistrationIdField) == undefined) {
                const id: string = uuidv4()
                workspaceService.editorStatus.defineEditorInfo(
                    id,
                    new EditorInfo(
                        resolveLanguageCode(view),
                        view.state.facet(EditorState.tabSize)
                    )
                )
                view.dispatch({
                    annotations: editorRegisteredAnnotation.of(id)
                })
            }
            workspaceService.editorStatus.activateEditor(view.state.field(editorRegistrationIdField)!)
        },
        blur(event, view) {
            const editorRegistrationId: string | undefined = view.state.field(editorRegistrationIdField)
            if (editorRegistrationId != undefined) {
                workspaceService.editorStatus.deactivateEditor(editorRegistrationId)
            }
        }
    })

    const updatePropagator: Extension = EditorView.updateListener.of((update) => {
        const editorRegistrationId: string | undefined = update.state.field(editorRegistrationIdField)
        if (editorRegistrationId != undefined) {
            const newSelections: EditorSelection[] = update.state.selection.ranges.map(range => {
                const headLine: Line = update.state.doc.lineAt(range.head)
                const anchorLine: Line = update.state.doc.lineAt(range.anchor)
                const headPositionInLine: number = range.head - headLine.from + 1
                const selectedCharacterCount: number = Math.abs(range.anchor - range.head)
                const lineBreaks: number =  Math.abs(anchorLine.number - headLine.number)

                return new EditorSelection(
                    headLine.number,
                    headPositionInLine,
                    selectedCharacterCount,
                    lineBreaks
                )
            })

            workspaceService.editorStatus.updateEditorInfo(
                editorRegistrationId,
                Immutable.List(newSelections)
            )
        }
    })

    const destroyer: ViewPlugin<any> = ViewPlugin.fromClass(class {
        private editorRegistrationId: string | undefined = undefined

        constructor(view: EditorView) {
            this.editorRegistrationId = view.state.field(editorRegistrationIdField)
        }

        update(update: ViewUpdate) {
            this.editorRegistrationId = update.state.field(editorRegistrationIdField)
        }

        destroy(): void {
            if (this.editorRegistrationId != undefined) {
                workspaceService.editorStatus.deleteEditorInfo(this.editorRegistrationId)
            }
        }
    })

    return [
        editorRegistrationIdField,
        lifecycleHandler,
        updatePropagator,
        destroyer
    ]
}
