import { test, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const sideTabsSource: string = readFileSync('src/modules/base/component/VSideTabs.vue', 'utf-8')

/**
 * Vuetify anchors the slider of vertical tabs to the left edge of the tab, which is the outer edge of
 * a left-side strip only. The right-side strip mirrors it, so dropping that override leaves the right
 * strip with its slider on the edge facing the panel it controls.
 */
test('Should mirror the tab slider on the right-side strip', () => {
    expect(sideTabsSource).not.toContain('hide-slider')
    expect(sideTabsSource).toMatch(/&--right\s*\{[^}]*:deep\(\.v-tab__slider\)\s*\{[^}]*right:\s*0/s)
})

/**
 * The strip is 3rem wide including its border, so tabs of a hardcoded 3rem overflow the content box
 * by the border width and clip the mirrored slider off the right-side strip.
 */
test('Should size side tabs to the strip content box', () => {
    const btnRule: string | undefined = /:deep\(\.v-btn\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/.exec(sideTabsSource)?.[1]
    expect(btnRule).toBeDefined()
    expect(btnRule).not.toMatch(/width:\s*3rem/)
})
