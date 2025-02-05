import { test, expect } from 'vitest'
import { parseHumanDurationToMs } from '../../src/utils/duration'

test('Should parse human duration', () => {
    expect(parseHumanDurationToMs('23ms')).toEqual(23n)
    expect(parseHumanDurationToMs('2h')).toEqual(7200000n)
    expect(parseHumanDurationToMs('4m')).toEqual(240000n)
    expect(parseHumanDurationToMs('10s')).toEqual(10000n)
    expect(parseHumanDurationToMs('2h 10s')).toEqual(7210000n)
    expect(parseHumanDurationToMs('2h 4m 10s 23ms')).toEqual(7450023n)
})

test('Should not parse human duration', () => {
    expect(() => parseHumanDurationToMs('')).toThrowError()
    expect(() => parseHumanDurationToMs('3.3m')).toThrowError()
    expect(() => parseHumanDurationToMs('2y')).toThrowError()
})
