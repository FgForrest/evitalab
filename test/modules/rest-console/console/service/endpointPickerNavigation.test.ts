import { describe, expect, test } from 'vitest'
import { moveEndpointHighlight } from '@/modules/rest-console/console/service/endpointPickerNavigation'

describe('Endpoint picker keyboard navigation', () => {
    test('Should move by one row', () => {
        expect(moveEndpointHighlight(0, 'down', 5)).toBe(1)
        expect(moveEndpointHighlight(3, 'up', 5)).toBe(2)
    })

    test('Should stop at both ends instead of wrapping', () => {
        expect(moveEndpointHighlight(4, 'down', 5)).toBe(4)
        expect(moveEndpointHighlight(0, 'up', 5)).toBe(0)
    })

    test('Should clamp a highlight left beyond a shrunk list', () => {
        expect(moveEndpointHighlight(9, 'down', 3)).toBe(2)
    })

    test('Should have no highlight in an empty list', () => {
        expect(moveEndpointHighlight(0, 'down', 0)).toBe(-1)
    })
})
