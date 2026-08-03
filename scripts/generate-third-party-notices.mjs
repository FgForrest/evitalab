#!/usr/bin/env node
/**
 * Generates `public/THIRD-PARTY-NOTICES.txt` — the attribution index for every third-party
 * artifact that ends up inside a built evitaLab bundle.
 *
 * The runtime closure is derived from the actual import graph, not from `package.json` →
 * `dependencies` (that block also holds build-only packages which never reach the bundle):
 * every bare module specifier used under `src/` is collected, mapped to a package, and the
 * transitive `dependencies` of those packages are walked through `node_modules`.
 *
 * Requires an installed `node_modules`. Run it manually and commit the output — it is
 * deliberately not wired into `yarn build`, so that a stale notices file surfaces as a failing
 * test instead of being silently regenerated.
 *
 * Usage: `node scripts/generate-third-party-notices.mjs [--check]`
 *   --check  do not write, exit non-zero when the committed file is out of date
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(rootDir, 'src')
const modulesDir = path.join(rootDir, 'node_modules')
// `public/` is what ships inside the built artifact; the repository root copy carries the same
// content in the source distribution
const outputFiles = [
    path.join(rootDir, 'public', 'THIRD-PARTY-NOTICES.txt'),
    path.join(rootDir, 'THIRD-PARTY-NOTICES.txt')
]

const rootManifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))

const scannedExtensions = ['.ts', '.tsx', '.vue', '.js', '.mjs', '.mts', '.scss', '.css']

/**
 * Packages whose license cannot be determined automatically, or where evitaLab has to make a
 * choice. Extend this table when a new dependency ships no usable license metadata.
 */
const licenseOverrides = {
    // no `license` field in package.json at all; ships a MIT-LICENSE file and MIT source headers
    keymaster: { license: 'MIT' },
    // dual-licensed "MPL-2.0 OR Apache-2.0" — evitaLab elects Apache-2.0, so MPL's per-file
    // source-disclosure obligation never arises
    dompurify: { license: 'Apache-2.0', note: 'elected from "MPL-2.0 OR Apache-2.0"' }
}

/**
 * Fonts are bundled as standalone binary assets rather than as code, so they get their own
 * section with a dedicated license file each.
 */
const fontNotices = [
    {
        name: 'Poppins',
        assets: 'assets/poppins-*.woff2',
        copyright: 'Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins)',
        license: 'SIL Open Font License 1.1',
        licenseFile: 'licenses/OFL-1.1-Poppins.txt',
        packagedVia: '@fontsource/poppins'
    },
    {
        name: 'Material Design Icons',
        assets: 'assets/materialdesignicons-webfont.*',
        copyright: 'Copyright Pictogrammers (https://pictogrammers.com), Austin Andrews and contributors',
        license: 'Pictogrammers Free License; the webfont itself is Apache License 2.0',
        licenseFile: 'licenses/Apache-2.0-MaterialDesignIcons.txt and licenses/Apache-2.0.txt',
        packagedVia: '@mdi/font'
    }
]

main()

function main() {
    assertDependenciesInstalled()

    const packages = resolveRuntimeClosure()
    const notices = packages.map(describePackage)
    const content = render(notices)

    if (process.argv.includes('--check')) {
        const stale = outputFiles.filter((file) => readFileOrEmpty(file) !== content)
        if (stale.length > 0) {
            const names = stale.map((it) => path.relative(rootDir, it)).join(', ')
            console.error(`${names} out of date, re-run: node scripts/generate-third-party-notices.mjs`)
            process.exit(1)
        }
        console.log('THIRD-PARTY-NOTICES.txt is up to date')
        return
    }

    for (const file of outputFiles) {
        fs.writeFileSync(file, content)
    }
    console.log(`wrote ${notices.length} package notices to public/THIRD-PARTY-NOTICES.txt (mirrored at the repository root)`)
}

/**
 * Refuses to run against an absent or incomplete `node_modules`. Without this, an unresolvable
 * package is simply skipped: `--check` would report the committed notices as "out of date" and a
 * regular run would overwrite them with a truncated list, silently dropping attributions.
 */
function assertDependenciesInstalled() {
    if (!fs.existsSync(modulesDir)) {
        abort('node_modules is missing')
    }
    const unresolved = Object.keys(rootManifest.dependencies ?? {}).filter((it) => readManifest(it) == null)
    if (unresolved.length > 0) {
        abort(`node_modules is incomplete, unresolved: ${unresolved.join(', ')}`)
    }
}

function abort(reason) {
    console.error(`${reason} — run \`yarn install\` before generating the third-party notices`)
    process.exit(1)
}

/**
 * Collects the packages imported anywhere under `src/` and walks their transitive
 * `dependencies`.
 */
function resolveRuntimeClosure() {
    const direct = new Set()
    for (const file of walkFiles(srcDir)) {
        for (const specifier of extractBareSpecifiers(fs.readFileSync(file, 'utf8'))) {
            const packageName = toPackageName(specifier)
            if (packageName && !isExcluded(packageName)) {
                direct.add(packageName)
            }
        }
    }

    // A peer dependency is followed only when evitaLab's own `package.json` declares it — such a
    // package is not really "somebody else's peer", it is a direct dependency of ours that no file
    // under `src/` happens to name. `apexcharts` is the case in point: only `vue3-apexcharts`
    // imports it, yet evitaLab installs it and Vite inlines it into the bundle, so evitaLab is the
    // one distributing a copy of it and therefore the one that owes the attribution. Peers we do
    // not declare are never installed by us and never reach the bundle.
    const declaredDependencies = new Set(Object.keys(rootManifest.dependencies ?? {}))

    const closure = new Set()
    const queue = [...direct]
    while (queue.length > 0) {
        const packageName = queue.shift()
        if (closure.has(packageName)) {
            continue
        }
        const manifest = readManifest(packageName)
        if (manifest == null) {
            continue
        }
        closure.add(packageName)
        const dependencies = [
            ...Object.keys(manifest.dependencies ?? {}),
            ...Object.keys(manifest.peerDependencies ?? {}).filter((it) => declaredDependencies.has(it))
        ]
        for (const dependency of dependencies) {
            if (!closure.has(dependency) && !isExcluded(dependency)) {
                queue.push(dependency)
            }
        }
    }

    return [...closure].sort((a, b) => a.localeCompare(b))
}

/**
 * Type-only packages contribute no code to the bundle.
 */
function isExcluded(packageName) {
    return packageName.startsWith('@types/')
}

function* walkFiles(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            yield* walkFiles(entryPath)
        } else if (scannedExtensions.includes(path.extname(entry.name))) {
            yield entryPath
        }
    }
}

/**
 * Extracts module specifiers from ES imports/exports, dynamic imports, `require` calls and
 * SASS `@use`/`@import` rules.
 */
function extractBareSpecifiers(source) {
    const specifiers = []
    const patterns = [
        /(?:^|\n)\s*(?:import|export)[\s\S]{0,400}?from\s*['"]([^'"]+)['"]/g,
        /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /@(?:use|import)\s+['"]([^'"]+)['"]/g
    ]
    for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
            specifiers.push(match[1])
        }
    }
    return specifiers
}

/**
 * Turns a module specifier into a package name, or `null` for relative, aliased, virtual and
 * built-in specifiers.
 */
function toPackageName(specifier) {
    let normalized = specifier
    if (normalized.startsWith('pkg:')) {
        normalized = normalized.slice('pkg:'.length)
    }
    if (normalized.startsWith('.') || normalized.startsWith('/') || normalized.startsWith('@/')
        || normalized.startsWith('~') || normalized.startsWith('node:') || normalized.startsWith('virtual:')) {
        return null
    }
    const segments = normalized.split('/')
    const packageName = normalized.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
    return fs.existsSync(path.join(modulesDir, packageName, 'package.json')) ? packageName : null
}

function readFileOrEmpty(file) {
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

function readManifest(packageName) {
    const manifestFile = path.join(modulesDir, packageName, 'package.json')
    if (!fs.existsSync(manifestFile)) {
        return null
    }
    return JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
}

function describePackage(packageName) {
    const manifest = readManifest(packageName)
    const override = licenseOverrides[packageName]
    const license = override?.license ?? resolveLicense(manifest)
    return {
        name: packageName,
        version: manifest.version,
        license,
        note: override?.note,
        copyright: findCopyright(packageName, manifest)
    }
}

function resolveLicense(manifest) {
    if (typeof manifest.license === 'string') {
        return manifest.license
    }
    if (typeof manifest.license === 'object' && manifest.license?.type != null) {
        return manifest.license.type
    }
    if (Array.isArray(manifest.licenses)) {
        return manifest.licenses.map((it) => it.type ?? it).join(' OR ')
    }
    return 'UNKNOWN'
}

/**
 * Reads the copyright line out of the package's license file, falling back to the declared
 * author. MIT and BSD require the copyright line itself to be reproduced, not just the license
 * identifier.
 */
function findCopyright(packageName, manifest) {
    const packageDir = path.join(modulesDir, packageName)
    const candidates = fs.readdirSync(packageDir)
        .filter((entry) => /^(licen[cs]e|copying|notice)/i.test(entry))
        .map((entry) => path.join(packageDir, entry))
        .filter((entry) => fs.statSync(entry).isFile())

    for (const candidate of candidates) {
        const line = fs.readFileSync(candidate, 'utf8')
            .split(/\r?\n/)
            .map((it) => it.trim())
            .find(isCopyrightLine)
        if (line != null) {
            return trimRepeatedCopyrights(line)
        }
    }

    const author = typeof manifest.author === 'string' ? manifest.author : manifest.author?.name
    return author != null ? `Copyright ${author}` : null
}

/**
 * A real copyright statement starts with `Copyright` followed by a year, a `(c)`/`©` marker or a
 * capitalised holder name. That last requirement is what keeps prose out — Apache-2.0's own text,
 * which several packages ship as their only license file, contains sentences such as "copyright
 * notice that is included in or attached to the work".
 */
function isCopyrightLine(line) {
    const remainder = line.replace(/^(\(c\)\s*)?copyright\b\s*/i, '')
    if (remainder === line) {
        return false
    }
    // a leading `[` is the Apache-2.0 appendix placeholder `Copyright [yyyy] [name]`
    return /^([(©]|\d|[A-Z])/.test(remainder)
}

/**
 * Some packages (notably `@fontsource/*`) squash a per-font-file copyright list onto a single
 * line. All entries name the same holder, so only the first one is kept.
 */
function trimRepeatedCopyrights(line) {
    const segments = line.split(/(?=\bcopyright\b)/i).filter((it) => it.length > 0)
    if (segments.length <= 1) {
        return line
    }
    // drop the `<font-file>:` label that introduces the next copyright entry
    return segments[0].trim().replace(/\s*\S+:$/, '')
}

function render(notices) {
    const lines = []
    lines.push('evitaLab bundles the following third-party software.')
    lines.push('')
    lines.push('Generated by scripts/generate-third-party-notices.mjs — do not edit by hand.')
    lines.push('')

    lines.push('=== Fonts ===')
    lines.push('')
    for (const font of fontNotices) {
        lines.push(`${font.name} (${font.assets})`)
        lines.push(`  ${font.copyright}`)
        lines.push(`  ${font.license} — see ${font.licenseFile}`)
        lines.push(`  Packaged via ${font.packagedVia}.`)
        lines.push('')
    }

    lines.push('=== Bundled code (assets/*.js, assets/*.css) ===')
    lines.push('')
    lines.push('The full text of the Apache License 2.0 referenced below is in licenses/Apache-2.0.txt.')
    lines.push('')
    for (const notice of notices) {
        lines.push(`${notice.name}@${notice.version}`)
        lines.push(`  ${notice.license}${notice.note != null ? ` (${notice.note})` : ''}`)
        if (notice.copyright != null) {
            lines.push(`  ${notice.copyright}`)
        }
        lines.push('')
    }

    lines.push('=== Vendored source ===')
    lines.push('')
    lines.push('src/styles/hl.scss is derived from a highlight.js theme (BSD-3-Clause),')
    lines.push('Copyright (c) 2006, Ivan Sagalaev. See the copyright header in that file.')
    lines.push('')

    return lines.join('\n')
}
