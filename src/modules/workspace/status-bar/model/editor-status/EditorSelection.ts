/**
 * Defines a single text selection in an active editor
 */
export class EditorSelection {
    readonly line: number
    readonly column: number
    readonly selectedCharacterCount: number
    readonly lineBreaks: number

    constructor(line: number, headPositionInLine: number, selectedCharacterCount: number, lineBreaks: number) {
        this.line = line
        this.column = headPositionInLine
        this.selectedCharacterCount = selectedCharacterCount
        this.lineBreaks = lineBreaks
    }
}
