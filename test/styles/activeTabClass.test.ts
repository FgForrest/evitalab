import { test, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * `settings.scss` paints the active tab blue through the class Vuetify puts on a selected `VTab`.
 * That class is a Vuetify implementation detail behind a caret version range, so a rename silently
 * kills the highlight — which already happened once, when Vuetify 3.6.0 renamed the class the rule
 * used to target and left the console side tabs with no indication of the active view at all. This
 * asserts the two sides still agree.
 */
test('Should style the class Vuetify puts on a selected tab', () => {
    const vTabSource: string = readFileSync('node_modules/vuetify/lib/components/VTabs/VTab.js', 'utf-8')
    const selectedClass: string | undefined = /selectedClass:\s*'([^']+)'/.exec(vTabSource)?.[1]
    expect(selectedClass).toBeDefined()

    const styles: string = readFileSync('src/styles/settings.scss', 'utf-8')
    expect(styles).toContain(`&.${selectedClass} {`)
})
