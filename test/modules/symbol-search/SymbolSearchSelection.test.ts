import { describe, expect, test } from 'vitest'
import {
    SymbolSearchConfirmation,
    SymbolSearchSelection,
    SymbolSearchZone
} from '@/modules/symbol-search/model/SymbolSearchSelection'

/** catalog-like row with five actions, the GraphQL ones disabled */
const catalogRow: boolean[] = [true, true, true, false, false]
/** collection-like row with two actions */
const collectionRow: boolean[] = [true, true]
/** attribute-like row with one action */
const attributeRow: boolean[] = [true]
/** inactive catalog: no enabled action */
const deadRow: boolean[] = [false, false, false, false, false]

function selection(rows: boolean[][]): SymbolSearchSelection {
    const result: SymbolSearchSelection = new SymbolSearchSelection()
    result.reset(rows)
    return result
}

describe('zones', () => {
    test('Should start in the input zone with nothing selected', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        expect(s.zone).toBe(SymbolSearchZone.Input)
        expect(s.selectedRow).toBeUndefined()
        expect(s.selectedAction).toBeUndefined()
    })

    test('Should enter the list on the first symbol with arrow down', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        s.moveDown()
        expect(s.zone).toBe(SymbolSearchZone.List)
        expect(s.selectedRow).toBe(0)
        expect(s.selectedAction).toBe(0)
    })

    test('Should enter the list on the first symbol with Enter and execute nothing', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        expect(s.confirm()).toBe(SymbolSearchConfirmation.EnteredList)
        expect(s.zone).toBe(SymbolSearchZone.List)
        expect(s.selectedRow).toBe(0)
    })

    test('Should execute the selected action with Enter in the list zone', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        s.moveDown()
        expect(s.confirm()).toBe(SymbolSearchConfirmation.Execute)
    })

    test('Should do nothing on Enter without results', () => {
        const s: SymbolSearchSelection = selection([])
        expect(s.confirm()).toBe(SymbolSearchConfirmation.None)
        s.moveDown()
        expect(s.zone).toBe(SymbolSearchZone.Input)
    })

    test('Should return to the input zone with arrow up on the first row', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        s.moveDown()
        s.moveUp()
        expect(s.zone).toBe(SymbolSearchZone.Input)
        expect(s.selectedRow).toBeUndefined()
    })

    test('Should return to the input zone when the user types', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        s.moveDown()
        s.moveDown()
        s.reset([attributeRow])
        expect(s.zone).toBe(SymbolSearchZone.Input)
        s.moveDown()
        expect(s.selectedRow).toBe(0)
    })

    test('Should preselect the first result in the list zone when asked to', () => {
        const s: SymbolSearchSelection = new SymbolSearchSelection()
        s.reset([deadRow, catalogRow], true)
        expect(s.zone).toBe(SymbolSearchZone.List)
        expect(s.selectedRow).toBe(0)
        expect(s.confirm()).toBe(SymbolSearchConfirmation.None)
        s.reset([catalogRow, attributeRow], true)
        expect(s.selectedRow).toBe(0)
        expect(s.selectedAction).toBe(0)
        expect(s.confirm()).toBe(SymbolSearchConfirmation.Execute)
    })

    test('Should leave a preselected first result for the input zone on up and stay there for the caret', () => {
        const s: SymbolSearchSelection = new SymbolSearchSelection()
        s.reset([catalogRow, attributeRow], true)
        s.moveUp()
        expect(s.zone).toBe(SymbolSearchZone.Input)
        expect(s.moveRight()).toBe(false)
        expect(s.selectedRow).toBeUndefined()
    })

    test('Should stay in the input zone when preselecting without results', () => {
        const s: SymbolSearchSelection = new SymbolSearchSelection()
        s.reset([], true)
        expect(s.zone).toBe(SymbolSearchZone.Input)
        expect(s.selectedRow).toBeUndefined()
    })

    test('Should enter the list zone on hover', () => {
        const s: SymbolSearchSelection = selection([catalogRow, collectionRow])
        s.hover(1)
        expect(s.zone).toBe(SymbolSearchZone.List)
        expect(s.selectedRow).toBe(1)
        expect(s.selectedAction).toBe(0)
    })

    test('Should select the hovered action together with its row', () => {
        const s: SymbolSearchSelection = selection([attributeRow, catalogRow])
        expect(s.hoverAction(1, 2)).toBe(true)
        expect(s.zone).toBe(SymbolSearchZone.List)
        expect(s.selectedRow).toBe(1)
        expect(s.selectedAction).toBe(2)
        // the row hover that follows the action hover must not reset the action
        s.hover(1)
        expect(s.selectedAction).toBe(2)
    })

    test('Should restore a remembered row and action in the list zone', () => {
        const s: SymbolSearchSelection = selection([attributeRow, catalogRow])
        expect(s.restore(1, 2)).toBe(true)
        expect(s.zone).toBe(SymbolSearchZone.List)
        expect(s.selectedRow).toBe(1)
        expect(s.selectedAction).toBe(2)
    })

    test('Should restore the first enabled action when the remembered one is disabled now', () => {
        const s: SymbolSearchSelection = selection([catalogRow])
        s.restore(0, 4)
        expect(s.selectedRow).toBe(0)
        expect(s.selectedAction).toBe(0)
    })

    test('Should stay in the input zone when the remembered row does not exist', () => {
        const s: SymbolSearchSelection = selection([catalogRow])
        expect(s.restore(3, 0)).toBe(false)
        expect(s.zone).toBe(SymbolSearchZone.Input)
        expect(s.selectedRow).toBeUndefined()
    })

    test('Should ignore hovering a disabled action', () => {
        const s: SymbolSearchSelection = selection([catalogRow])
        s.hoverAction(0, 1)
        expect(s.hoverAction(0, 3)).toBe(false)
        expect(s.selectedAction).toBe(1)
    })
})

describe('rows', () => {
    test('Should clamp at the last row without wrapping', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        s.moveDown()
        s.moveDown()
        s.moveDown()
        expect(s.selectedRow).toBe(1)
    })

    test('Should keep the action index when the next row has it enabled', () => {
        const s: SymbolSearchSelection = selection([catalogRow, collectionRow, attributeRow])
        s.moveDown()
        s.moveRight()
        expect(s.selectedAction).toBe(1)
        s.moveDown()
        expect(s.selectedAction).toBe(1)
        // the attribute has a single action only
        s.moveDown()
        expect(s.selectedAction).toBe(0)
    })

    test('Should support page and boundary jumps in the list zone', () => {
        const rows: boolean[][] = Array.from({ length: 30 }, () => attributeRow)
        const s: SymbolSearchSelection = selection(rows)
        s.moveBy(10)
        expect(s.selectedRow).toBe(0)
        s.moveBy(10)
        expect(s.selectedRow).toBe(10)
        s.moveToLast()
        expect(s.selectedRow).toBe(29)
        s.moveBy(-100)
        expect(s.selectedRow).toBe(0)
        s.moveToFirst()
        expect(s.selectedRow).toBe(0)
    })

    test('Should keep a valid selection when results grow while browsing', () => {
        const s: SymbolSearchSelection = selection([catalogRow, attributeRow])
        s.moveDown()
        s.moveDown()
        s.updateRows([catalogRow])
        expect(s.selectedRow).toBe(0)
        s.updateRows([])
        expect(s.zone).toBe(SymbolSearchZone.Input)
    })
})

describe('actions', () => {
    test('Should not switch actions in the input zone', () => {
        const s: SymbolSearchSelection = selection([catalogRow])
        expect(s.moveRight()).toBe(false)
        expect(s.actionIndex).toBe(0)
    })

    test('Should move between actions and clamp at both ends', () => {
        const s: SymbolSearchSelection = selection([collectionRow])
        s.moveDown()
        s.moveLeft()
        expect(s.selectedAction).toBe(0)
        s.moveRight()
        s.moveRight()
        expect(s.selectedAction).toBe(1)
    })

    test('Should skip disabled actions', () => {
        const s: SymbolSearchSelection = selection([[true, false, true]])
        s.moveDown()
        s.moveRight()
        expect(s.selectedAction).toBe(2)
        s.moveLeft()
        expect(s.selectedAction).toBe(0)
    })

    test('Should preselect the first enabled action', () => {
        const s: SymbolSearchSelection = selection([[false, true]])
        s.moveDown()
        expect(s.selectedAction).toBe(1)
    })

    test('Should select no action on a row without enabled actions and not execute it', () => {
        const s: SymbolSearchSelection = selection([deadRow, collectionRow])
        s.moveDown()
        expect(s.selectedRow).toBe(0)
        expect(s.selectedAction).toBeUndefined()
        expect(s.moveRight()).toBe(false)
        expect(s.confirm()).toBe(SymbolSearchConfirmation.None)
        s.moveDown()
        expect(s.selectedAction).toBe(0)
    })
})
