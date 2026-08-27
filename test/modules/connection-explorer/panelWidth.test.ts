import { expect, test } from 'vitest'
import {
    clampPanelWidth,
    defaultPanelWidth,
    minPanelWidth,
    sanitizePanelWidth
} from '@/modules/connection-explorer/model/panelWidth'

/**
 * Tests for the connection explorer panel width sanitization and clamping
 */

test('Should fall back to the default width for unusable values', () => {
    expect(sanitizePanelWidth(undefined)).toEqual(defaultPanelWidth)
    expect(sanitizePanelWidth(null)).toEqual(defaultPanelWidth)
    expect(sanitizePanelWidth('325')).toEqual(defaultPanelWidth)
    expect(sanitizePanelWidth(Number.NaN)).toEqual(defaultPanelWidth)
    expect(sanitizePanelWidth(Number.POSITIVE_INFINITY)).toEqual(defaultPanelWidth)
    expect(sanitizePanelWidth(-100)).toEqual(defaultPanelWidth)
    expect(sanitizePanelWidth(0)).toEqual(defaultPanelWidth)
})

test('Should round stored widths to whole pixels', () => {
    expect(sanitizePanelWidth(400.4)).toEqual(400)
    expect(sanitizePanelWidth(400.6)).toEqual(401)
})

test('Should keep a width that fits the viewport', () => {
    expect(clampPanelWidth(400, 1920)).toEqual(400)
    expect(clampPanelWidth(defaultPanelWidth, 1920)).toEqual(defaultPanelWidth)
})

test('Should clamp a width below the minimum', () => {
    expect(clampPanelWidth(100, 1920)).toEqual(minPanelWidth)
})

test('Should clamp a width to at most half of the viewport', () => {
    expect(clampPanelWidth(1500, 1920)).toEqual(960)
})

test('Should leave space for the rest of the workspace on a narrow viewport', () => {
    // 800 - 460 of reserved content space is a tighter limit than half of the viewport
    expect(clampPanelWidth(700, 800)).toEqual(340)
})

test('Should prefer the minimum when the viewport allows no usable maximum', () => {
    // a viewport this narrow cannot satisfy both limits, an unusable panel would be worse than a cramped workspace
    expect(clampPanelWidth(400, 600)).toEqual(minPanelWidth)
    expect(clampPanelWidth(100, 300)).toEqual(minPanelWidth)
})

test('Should clamp an unusable width through the default', () => {
    expect(clampPanelWidth(Number.NaN, 1920)).toEqual(defaultPanelWidth)
    expect(clampPanelWidth(Number.NaN, 600)).toEqual(minPanelWidth)
})

test('Should ignore an unknown viewport width', () => {
    expect(clampPanelWidth(1500, 0)).toEqual(1500)
    expect(clampPanelWidth(1500, Number.NaN)).toEqual(1500)
})
