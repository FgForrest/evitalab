// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import type { ComponentResolver } from 'unplugin-vue-components'

// Utilities
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import XXH, { HashObject } from 'xxhashjs'
import { OutputOptions } from 'rollup'

const hasher: HashObject = XXH.h64()

export default defineConfig(({ mode }) => {
    const env: Record<string, string> = loadEnv(mode, process.cwd(), '')
    const labRunMode: string = resolveLabRunMode(env)
    const baseUrl: string = resolveBaseUrl(labRunMode)
    const evitaLabVersionSuffix: string = resolveEvitaLabVersionSuffix(env)

    let outputOptions: OutputOptions
    if (labRunMode === 'STANDALONE') {
        outputOptions = {
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
            VueRouter({
                dts: 'src/typed-router.d.ts',
            }),
            Layouts(),
            AutoImport({
                imports: [
                    'vue',
                    VueRouterAutoImports,
                    {
                        pinia: ['defineStore', 'storeToRefs'],
                    },
                ],
                dts: 'src/auto-imports.d.ts',
                eslintrc: { enabled: true },
                vueTemplate: true,
            }),
            Components({
                dts: 'src/components.d.ts',
                resolvers: [
                    {
                        type: 'component',
                        resolve: (name: string) => {
                            if (name === 'apexchart') {
                                return {
                                    name: 'default',
                                    from: 'vue3-apexcharts',
                                }
                            }
                        },
                    } as ComponentResolver,
                ],
            }),
            Vue({
                template: { transformAssetUrls },
            }),
            Vuetify({
                autoImport: true,
                styles: {
                    configFile: 'src/styles/settings.scss',
                },
            }),
            Fonts({
                fontsource: {
                    families: [
                        {
                            name: 'Roboto',
                            weights: [100, 300, 400, 500, 700, 900],
                            styles: ['normal', 'italic'],
                        },
                    ],
                },
            }),
        ],
        optimizeDeps: {
            exclude: [
                'vuetify',
                'vue-router',
                'unplugin-vue-router/runtime',
                'unplugin-vue-router/data-loaders',
                'unplugin-vue-router/data-loaders/basic',
            ],
        },
        build: {
            rollupOptions: {
                output: outputOptions,
            },
        },
        define: { 'process.env': {} },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('src', import.meta.url)),
            },
            extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
        },
        server: {
            port: 3000,
            strictPort: true,
            host: true,
        },
        base: baseUrl,
        css: {
            preprocessorOptions: {
                sass: {
                    api: 'modern-compiler',
                },
                scss: {
                    api: 'modern-compiler',
                },
            },
        },
    }
})

function resolveLabRunMode(env: Record<string, string>): string {
    const customLabRunMode: string | undefined = env.VITE_RUN_MODE
    if (!customLabRunMode || customLabRunMode.trim().length === 0) {
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
    const normalizedVersion = actualVersion && actualVersion.length > 0 ? actualVersion : 'dev'
    return hasher.update(normalizedVersion).digest().toString(16)
}
