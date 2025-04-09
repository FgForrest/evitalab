import { test, expect } from 'vitest'
import semver from 'semver/preload'

/**
 * Tests for sem versioning
 */

test('Should correctly compare versions', () => {
    expect(semver.satisfies('2024.8.0', '>=2024.8.x')).toEqual(true)
    expect(semver.satisfies('2024.8.4', '>=2024.8.x')).toEqual(true)
    expect(semver.gt('2024.5.0', '2024.1.0')).toEqual(true)
    expect(semver.lt('2024.1.0', '2024.5.0')).toEqual(true)
})
