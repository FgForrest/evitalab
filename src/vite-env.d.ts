/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

interface ImportMetaEnv {
    readonly VITE_BUILD_VERSION: string
    readonly VITE_RUN_MODE: string
    readonly VITE_DEV_CONNECTION: 'DEMO' | 'LOCAL'
    readonly VITE_DEV_LOCAL_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
