import { ChangeSet, EditorSelection, EditorState, Transaction } from '@codemirror/state'
import type { ChangeSpec, Extension, TransactionSpec } from '@codemirror/state'
import { flattenToSingleLine } from '@/modules/code-editor/model/flattenToSingleLine'

/**
 * Keeps the editor document on a single line. Instead of rejecting transactions that would introduce
 * line breaks, it rewrites them, so every inserted text run is flattened by
 * {@link flattenToSingleLine} before it reaches the document. This covers all insertion paths at once
 * (typing, pasting, drag & drop, programmatic dispatch).
 *
 * Pressing `Enter` stays a no-op, because the inserted line break and indentation flatten to an empty
 * string.
 */
export function singleLineDocument(): Extension {
    return [
        EditorState.transactionFilter.of(tr => {
            let insertsLineBreak: boolean = false
            tr.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
                if (inserted.lines > 1) {
                    insertsLineBreak = true
                }
            })
            if (!insertsLineBreak) {
                return tr
            }

            // specs returned from a transaction filter are interpreted against the start state, which is
            // the coordinate space of the `fromA`/`toA` positions below
            const changes: ChangeSpec[] = []
            tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
                changes.push({ from: fromA, to: toA, insert: flattenToSingleLine(inserted.toString()) })
            })
            const changeSet: ChangeSet = ChangeSet.of(changes, tr.startState.doc.length)

            // the selection of the original transaction points into the not-yet-flattened text, and is
            // therefore recomputed to a plain cursor right after the inserted text; a multi-range
            // selection collapses to its main cursor, which is all a single-line editor can express
            const cursorAfterInsertedText: number = changeSet.mapPos(tr.startState.selection.main.head, 1)

            // rebuilding the spec loses annotations; the user event must be carried over explicitly to
            // keep undo grouping intact (a pasted query has to be undone by a single undo)
            const rewritten: TransactionSpec = {
                changes: changeSet,
                selection: EditorSelection.cursor(cursorAfterInsertedText),
                effects: tr.effects,
                scrollIntoView: tr.scrollIntoView,
                userEvent: tr.annotation(Transaction.userEvent)
            }
            return [rewritten]
        })
    ]
}
