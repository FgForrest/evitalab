// Plugins
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import XXH, { HashObject } from 'xxhashjs'
import { OutputOptions } from 'rollup'

const hasher: HashObject = XXH.h64()

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env: Record<string, string> = loadEnv(mode, process.cwd(), '')
    const labRunMode: string = resolveLabRunMode(env)
    const baseUrl: string = resolveBaseUrl(labRunMode)
    const evitaLabVersionSuffix: string = resolveEvitaLabVersionSuffix(env)

    let outputOptions: OutputOptions
    if (labRunMode === 'STANDALONE') {
        outputOptions = {
            // add evitaLab version to the generated files to control cache
            // between different evitaLab version from the same server hostname
            chunkFileNames: `assets/[name]-[hash]-${evitaLabVersionSuffix}.js`,
            entryFileNames: `assets/[name]-${evitaLabVersionSuffix}.js`,
            assetFileNames: `assets/[name]-[hash]-${evitaLabVersionSuffix}[extname]`
        }
    } else if (labRunMode === 'DRIVER') {
        outputOptions = {
            inlineDynamicImports: true
        }
    }

    return {
        plugins: [
            vue({
                template: { transformAssetUrls }
            }),
            // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
            vuetify({
                autoImport: true,
                styles: {
                    configFile: 'src/styles/settings.scss'
                }
            })
        ],
        build: {
            rollupOptions: {
                output: outputOptions
            }
        },
        define: { 'process.env': {} },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            },
            extensions: [
                '.js',
                '.json',
                '.jsx',
                '.mjs',
                '.ts',
                '.tsx',
                '.vue'
            ]
        },
        server: {
            port: 3000,
            strictPort: true,
            host: true
        },
        base: baseUrl
    }
})

function resolveLabRunMode(env: Record<string, string>): string {
    const customLabRunMode: string | undefined = env.VITE_RUN_MODE
    if (customLabRunMode == undefined || customLabRunMode.trim().length === 0) {
        return 'STANDALONE'
    }
    return customLabRunMode
}

function resolveBaseUrl(labRunMode: string): string {
    switch (labRunMode) {
        case 'STANDALONE': return '/lab'
        case 'DRIVER': return './'
        default: throw new Error(`Unsupported lab run mode ${labRunMode}`)
    }
}

function resolveEvitaLabVersionSuffix(env: Record<string, string>): string {
    const actualVersion: string | undefined = env.VITE_BUILD_VERSION
    let normalizedVersion: string
    if (actualVersion == undefined || actualVersion.length === 0) {
        normalizedVersion = 'dev'
    } else {
        normalizedVersion = actualVersion
    }
    return hasher
        .update(normalizedVersion)
        .digest()
        .toString(16)
}
