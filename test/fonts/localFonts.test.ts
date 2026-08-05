import { test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Guards issue #183: all web fonts must be served from evitaLab itself, never fetched from a
 * remote font provider (GDPR — a remote font request leaks the visitor's IP address).
 */

const rootDir: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const forbiddenPatterns: string[] = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'webfontloader'
]

const scannedExtensions: string[] = ['.ts', '.tsx', '.vue', '.js', '.mjs', '.mts', '.scss', '.css', '.html', '.json']

test('Should not reference any remote font provider', () => {
    const scannedFiles: string[] = [
        ...walkFiles(path.join(rootDir, 'src')),
        path.join(rootDir, 'index.html'),
        path.join(rootDir, 'vite.config.mts'),
        path.join(rootDir, 'package.json')
    ]

    const offendingFiles: string[] = []
    for (const file of scannedFiles) {
        const content: string = fs.readFileSync(file, 'utf8')
        for (const pattern of forbiddenPatterns) {
            if (content.includes(pattern)) {
                offendingFiles.push(`${path.relative(rootDir, file)} contains '${pattern}'`)
            }
        }
    }

    expect(offendingFiles).toEqual([])
})

test('Should declare the self-hosted Poppins faces locally', () => {
    const fonts: string = fs.readFileSync(path.join(rootDir, 'src', 'styles', 'fonts.scss'), 'utf8')
    expect(fonts).toContain('@fontsource/poppins')
    expect(fs.existsSync(path.join(rootDir, 'node_modules', '@fontsource', 'poppins', 'files'))).toBe(true)
})

/**
 * Guards the attribution files required by the licenses of the redistributed fonts
 * (SIL Open Font License 1.1 §2) and of the bundled Apache-2.0 dependencies (§4(a)) against
 * silently disappearing in a future refactor.
 */
test('Should ship third-party license notices inside the bundle', () => {
    const ofl: string = readPublicFile('licenses/OFL-1.1-Poppins.txt')
    expect(ofl).toContain('SIL OPEN FONT LICENSE')
    expect(ofl).toContain('The Poppins Project Authors')

    expect(readPublicFile('licenses/Apache-2.0.txt')).toContain('Apache License')
    expect(readPublicFile('licenses/Apache-2.0-MaterialDesignIcons.txt')).toContain('Apache 2.0')

    const notices: string = readPublicFile('THIRD-PARTY-NOTICES.txt')
    for (const packageName of ['@bufbuild/protobuf', '@connectrpc/connect', '@connectrpc/connect-web', 'dompurify']) {
        expect(notices).toContain(packageName)
    }
    expect(notices).toContain('Poppins')
    expect(notices).toContain('Material Design Icons')

    // the repository root mirror carries the notices in the source distribution
    expect(fs.readFileSync(path.join(rootDir, 'THIRD-PARTY-NOTICES.txt'), 'utf8')).toEqual(notices)
})

function readPublicFile(relativePath: string): string {
    const content: string = fs.readFileSync(path.join(rootDir, 'public', relativePath), 'utf8')
    expect(content.length, `${relativePath} must not be empty`).toBeGreaterThan(0)
    return content
}

function walkFiles(directory: string): string[] {
    const files: string[] = []
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath: string = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            files.push(...walkFiles(entryPath))
        } else if (scannedExtensions.includes(path.extname(entry.name))) {
            files.push(entryPath)
        }
    }
    return files
}
