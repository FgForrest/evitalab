/**
 * Logical focus zone of the symbol search popup. DOM focus stays in the search field the whole time, so typing
 * always works; the zone decides what the navigation keys do.
 */
export enum SymbolSearchZone {
    /** no row selected, ←/→ move the caret, Enter and ↓ enter the list */
    Input = 'input',
    /** a row is selected, ←/→ switch its actions, Enter executes the selected one */
    List = 'list'
}

/**
 * What a press of Enter resolved to.
 */
export enum SymbolSearchConfirmation {
    /** nothing to do (no results, or a row without any enabled action) */
    None = 'none',
    /** moved from the input zone onto the first result */
    EnteredList = 'enteredList',
    /** the selected action of the selected row is to be executed */
    Execute = 'execute'
}

/**
 * Keyboard and mouse selection over the rendered results of the symbol search: which zone is active, which row
 * and which of its actions are selected. Rows are described only by the enabled flags of their actions, so the
 * logic stays independent of symbols and the DOM.
 *
 * Rows clamp at both ends (no wrap-around). Moving to another row keeps the action index when the new row has that
 * action enabled, otherwise selects its first enabled action. A row with no enabled action has none selected.
 */
export class SymbolSearchSelection {
    zone: SymbolSearchZone = SymbolSearchZone.Input
    rowIndex: number = 0
    /** index of the selected action of the row, -1 when the row has no enabled action */
    actionIndex: number = -1

    private rows: boolean[][] = []

    /**
     * Index of the selected row, only in the list zone.
     */
    get selectedRow(): number | undefined {
        return this.zone === SymbolSearchZone.List && this.rows.length > 0 ? this.rowIndex : undefined
    }

    /**
     * Index of the selected enabled action, only in the list zone.
     */
    get selectedAction(): number | undefined {
        if (this.selectedRow == undefined || this.actionIndex < 0) {
            return undefined
        }
        return this.actionIndex
    }

    /**
     * Starts over with new results: first row, its first enabled action.
     *
     * @param rows enabled flags of the actions of every rendered row
     * @param selectFirst whether the first row starts selected in the list zone (so Enter runs its action right
     *                    away), otherwise the selection starts in the input zone
     */
    reset(rows: boolean[][], selectFirst: boolean = false): void {
        this.rows = rows
        this.zone = selectFirst && rows.length > 0 ? SymbolSearchZone.List : SymbolSearchZone.Input
        this.rowIndex = 0
        this.actionIndex = this.firstEnabledAction(0)
    }

    /**
     * Replaces the rows without resetting the selection (results refreshed while the user browses them).
     */
    updateRows(rows: boolean[][]): void {
        this.rows = rows
        if (rows.length === 0) {
            this.reset(rows)
            return
        }
        this.rowIndex = Math.min(this.rowIndex, rows.length - 1)
        this.actionIndex = this.carryOverAction(this.rowIndex, this.actionIndex)
    }

    moveDown(): boolean {
        return this.moveBy(1)
    }

    moveUp(): boolean {
        return this.moveBy(-1)
    }

    /**
     * Moves the row selection by a delta. From the input zone, a downward move enters the list on the first row;
     * an upward move from the first row returns to the input zone.
     *
     * @return whether anything changed
     */
    moveBy(delta: number): boolean {
        if (this.rows.length === 0 || delta === 0) {
            return false
        }
        if (this.zone === SymbolSearchZone.Input) {
            if (delta < 0) {
                return false
            }
            this.enterList()
            return true
        }
        if (delta < 0 && this.rowIndex === 0) {
            this.zone = SymbolSearchZone.Input
            return true
        }
        return this.selectRow(Math.max(0, Math.min(this.rows.length - 1, this.rowIndex + delta)))
    }

    moveToFirst(): boolean {
        if (this.zone !== SymbolSearchZone.List) {
            return false
        }
        return this.selectRow(0)
    }

    moveToLast(): boolean {
        if (this.zone !== SymbolSearchZone.List) {
            return false
        }
        return this.selectRow(this.rows.length - 1)
    }

    moveRight(): boolean {
        return this.moveAction(1)
    }

    moveLeft(): boolean {
        return this.moveAction(-1)
    }

    /**
     * Selects a row by the mouse, which also enters the list zone.
     */
    hover(rowIndex: number): boolean {
        if (rowIndex < 0 || rowIndex >= this.rows.length) {
            return false
        }
        if (this.zone === SymbolSearchZone.List && this.rowIndex === rowIndex) {
            return false
        }
        if (this.rowIndex !== rowIndex) {
            this.rowIndex = rowIndex
            this.actionIndex = this.firstEnabledAction(rowIndex)
        }
        this.zone = SymbolSearchZone.List
        return true
    }

    /**
     * Selects an action (and its row) by the mouse, which also enters the list zone. Disabled actions are ignored.
     */
    hoverAction(rowIndex: number, actionIndex: number): boolean {
        if (this.rows[rowIndex]?.[actionIndex] !== true) {
            return false
        }
        if (this.zone === SymbolSearchZone.List && this.rowIndex === rowIndex && this.actionIndex === actionIndex) {
            return false
        }
        this.rowIndex = rowIndex
        this.actionIndex = actionIndex
        this.zone = SymbolSearchZone.List
        return true
    }

    /**
     * Selects a remembered row and action in the list zone (popup reopened after an executed action). Falls back to
     * the first enabled action when the remembered one is not enabled any more.
     */
    restore(rowIndex: number, actionIndex: number): boolean {
        if (rowIndex < 0 || rowIndex >= this.rows.length) {
            return false
        }
        this.rowIndex = rowIndex
        this.actionIndex = this.carryOverAction(rowIndex, actionIndex)
        this.zone = SymbolSearchZone.List
        return true
    }

    /**
     * Resolves a press of Enter.
     */
    confirm(): SymbolSearchConfirmation {
        if (this.rows.length === 0) {
            return SymbolSearchConfirmation.None
        }
        if (this.zone === SymbolSearchZone.Input) {
            this.enterList()
            return SymbolSearchConfirmation.EnteredList
        }
        return this.selectedAction != undefined ? SymbolSearchConfirmation.Execute : SymbolSearchConfirmation.None
    }

    private enterList(): void {
        this.zone = SymbolSearchZone.List
        this.rowIndex = 0
        this.actionIndex = this.firstEnabledAction(0)
    }

    private selectRow(rowIndex: number): boolean {
        if (rowIndex === this.rowIndex) {
            return false
        }
        this.actionIndex = this.carryOverAction(rowIndex, this.actionIndex)
        this.rowIndex = rowIndex
        return true
    }

    private moveAction(delta: number): boolean {
        if (this.zone !== SymbolSearchZone.List || this.actionIndex < 0) {
            return false
        }
        const actions: boolean[] = this.rows[this.rowIndex] ?? []
        for (let i = this.actionIndex + delta; i >= 0 && i < actions.length; i += delta) {
            if (actions[i] === true) {
                this.actionIndex = i
                return true
            }
        }
        return false
    }

    private carryOverAction(rowIndex: number, actionIndex: number): number {
        const actions: boolean[] = this.rows[rowIndex] ?? []
        if (actionIndex >= 0 && actions[actionIndex] === true) {
            return actionIndex
        }
        return this.firstEnabledAction(rowIndex)
    }

    private firstEnabledAction(rowIndex: number): number {
        const actions: boolean[] = this.rows[rowIndex] ?? []
        return actions.indexOf(true)
    }
}
