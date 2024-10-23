import { test, expect } from 'vitest'
import { round } from '../../src/utils/number'

test('Should round to specific decimal places', () => {
    expect(round(12.12543, 0)).toEqual(12)
    expect(round(12.12543, 5)).toEqual(12.12543)
    expect(round(12.12543, 2)).toEqual(12.13)
})
