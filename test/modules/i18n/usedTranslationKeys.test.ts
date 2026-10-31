import { expect, test } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A key passed to `t(...)` that is missing in `en.json` is not an error at runtime: vue-i18n prints the key itself
 * (`trafficViewer.recordHistory.record.type.mutation.title` once ended up as a traffic record title). This checks
 * every literal key in the sources; keys built at runtime (template literals, variables) are not covered.
 */

const literalKeyPattern: RegExp = /\bt\(\s*['"]([A-Za-z0-9_\-]+(?:\.[A-Za-z0-9_\-]+)+)['"]/g

function sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path: string = join(directory, entry.name)
        if (entry.isDirectory()) {
            return path.endsWith(join('grpc', 'gen')) ? [] : sourceFiles(path)
        }
        return /\.(ts|vue)$/.test(entry.name) ? [path] : []
    })
}

function hasKey(messages: Record<string, unknown>, key: string): boolean {
    let node: unknown = messages
    for (const part of key.split('.')) {
        if (typeof node !== 'object' || node == null || !Object.hasOwn(node, part)) {
            return false
        }
        node = (node as Record<string, unknown>)[part]
    }
    return true
}

test('Should define every literal translation key used in the sources', () => {
    const messages: Record<string, unknown> = JSON.parse(readFileSync('src/modules/i18n/en.json', 'utf-8'))

    const missingKeys: string[] = sourceFiles('src').flatMap(file =>
        Array.from(readFileSync(file, 'utf-8').matchAll(literalKeyPattern))
            .map(match => match[1]!)
            .filter(key => !hasKey(messages, key))
            .map(key => `${key} (${file})`)
    )

    expect(missingKeys).toEqual([])
})
