/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
    readonly VITE_BUILD_VERSION: string
    readonly VITE_RUN_MODE: string
    readonly VITE_DEV_CONNECTION: 'DEMO' | 'LOCAL'
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
