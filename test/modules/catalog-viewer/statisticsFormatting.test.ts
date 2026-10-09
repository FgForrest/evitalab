import { test, expect } from 'vitest'
import type { App } from 'vue'
import LuxonExtensions from '../../../src/vue-plugins/luxonExtensions'
import {
    formatDuration,
    formatPercent,
    formatSmallPercent,
    share
} from '../../../src/modules/catalog-viewer/service/statisticsFormatting'

// the digit grouping and the space before the percent sign follow the runtime locale, so the assertions look at
// the digits alone

// the duration assertions only hold with the app's `toHuman` patch in place, which the bootstrap installs as a
// Vue plugin
LuxonExtensions.install!({} as App, {})

test('Should keep a rare share readable instead of rounding it to zero', () => {
    expect(formatSmallPercent(share(3118n, 4817728n))).toMatch(/0[.,]065/)

    const rare: number | undefined = share(3n, 100000n)
    expect(formatSmallPercent(rare)).toMatch(/0[.,]003/)
    expect(formatPercent(rare)).toMatch(/^0\s*%$/)
})

test('Should report a share that is genuinely zero as zero', () => {
    expect(formatSmallPercent(share(0n, 1000n))).toMatch(/^0\s*%$/)
})

test('Should format a large share without significant-digit noise', () => {
    expect(formatSmallPercent(share(1n, 2n))).toMatch(/^50\s*%$/)
})

test('Should treat a share of nothing as undetermined rather than zero', () => {
    expect(share(0n, 0n)).toBeUndefined()
})

test('Should keep the milliseconds of a sub-second duration', () => {
    expect(formatDuration(214n)).toBe('214 ms')
    expect(formatDuration(11n)).toBe('11 ms')
})

test('Should not round a duration down onto the value it is being compared against', () => {
    // a cadence of 1 017 ms above a configured interval of 1 000 ms must not read as the interval itself
    expect(formatDuration(1017n)).toBe('1 sec, 17 ms')
    expect(formatDuration(1000n)).toBe('1 sec')
})

test('Should keep coarse durations coarse', () => {
    expect(formatDuration(60000n)).toBe('1 min')
    expect(formatDuration(3600000n)).toBe('1 hr')
})
