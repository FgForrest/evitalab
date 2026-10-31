import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

/**
 * Globals injected by unplugin-auto-import (ref, computed, useRoute, ...). The
 * plugin regenerates `.eslintrc-auto-import.json` on dev/build; it is gitignored
 * and may be absent on a fresh checkout, so its absence is tolerated.
 */
function autoImportGlobals() {
    try {
        const path = fileURLToPath(new URL('./.eslintrc-auto-import.json', import.meta.url))
        return JSON.parse(readFileSync(path, 'utf8')).globals ?? {}
    } catch {
        return {}
    }
}

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{ts,mts,tsx,vue}'],
    },
    {
        name: 'app/files-to-ignore',
        ignores: [
            'dist/**',
            'src/auto-imports.d.ts',
            'src/components.d.ts',
            'src/typed-router.d.ts',
            'src/modules/database-driver/connector/grpc/gen/**',
        ],
    },
    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,
    {
        name: 'app/language-options',
        languageOptions: {
            globals: autoImportGlobals(),
        },
    },
    {
        name: 'app/rules',
        rules: {
            'vue/multi-word-component-names': 'off',
            // empty marker / single-extend interfaces are an intentional pattern in the
            // model layer (Mutation, EntityMutation, *Dto extends *); still flags the
            // confusing `{}` object type-literal.
            '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
            // honor the `_` prefix convention for intentionally-unused bindings
            // (matches TypeScript's noUnusedLocals/noUnusedParameters behavior)
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
            }],
        },
    },
    {
        // the data layer and the generic UI foundation know nothing about how values are presented
        name: 'app/module-boundaries/value-presentation-consumers',
        files: ['src/modules/database-driver/**/*.{ts,mts,tsx,vue}', 'src/modules/base/**/*.{ts,mts,tsx,vue}'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: ['@/modules/value-presentation', '@/modules/value-presentation/**'],
                    message: '`database-driver` and `base` must not depend on `value-presentation`.',
                }],
            }],
        },
    },
    {
        // may use the driver's types and base exceptions, never a feature module
        name: 'app/module-boundaries/value-presentation',
        files: ['src/modules/value-presentation/**/*.{ts,mts,tsx,vue}'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [{
                    group: [
                        // gitignore semantics: a path can be re-included only when its parent directory is not
                        // excluded, so `@/modules/**` cannot be negated — exclude one level, re-include what is allowed
                        '@/modules/*',
                        '!@/modules/database-driver',
                        '!@/modules/value-presentation',
                        '!@/modules/base',
                        '@/modules/base/*',
                        '!@/modules/base/exception',
                    ],
                    message: '`value-presentation` may import only `database-driver`, `base/exception` and itself.',
                }],
            }],
        },
    },
)
