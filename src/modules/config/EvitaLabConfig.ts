import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import Immutable from 'immutable'
import { Router } from 'vue-router'
import { LabRunMode } from '@/LabRunMode'

const systemPropertiesControlParamName: string = 'evitalab'
const systemPropertyUrlPrefix: string = 'evitalab-'

/**
 * System property containing the name of a hosting server. This is mainly for namespacing storages.
 */
const serverNameSystemPropertyName: string = 'server-name'
const defaultServerName: string = 'standalone'

/**
 * System property containing the read-only flag. This defines whether the lab is in read-only mode.
 */
const readOnlySystemPropertyName: string = 'readonly'

export const evitaLabConfigInjectionKey: InjectionKey<EvitaLabConfig> = Symbol('evitaLabConfig')

/**
 * Holds current evitaLab config
 */
export class EvitaLabConfig {

    private readonly _runMode: LabRunMode
    private readonly _playgroundMode: boolean
    private readonly systemProperties: Immutable.Map<string, string>

    private constructor(runMode: LabRunMode,
                        playgroundMode: boolean,
                        systemProperties: Immutable.Map<string, string>) {
        this._runMode = runMode
        this._playgroundMode = playgroundMode
        this.systemProperties = systemProperties
    }

    /**
     * Load config
     */
    static async load(router: Router): Promise<EvitaLabConfig> {
        const systemProperties: Map<string, string> = new Map()

        // resolve system properties from URL and hide them from user
        const queryParams: URLSearchParams = new URLSearchParams(document.location.search)
        const newQueryParams: Map<string, string> = new Map()
        queryParams.forEach((value: string, key: string) => {
            if (key === systemPropertiesControlParamName) {
                // don't pass forward
            } else if (key.startsWith(systemPropertyUrlPrefix)) {
                systemProperties.set(key.substring(systemPropertyUrlPrefix.length), atob(value))
            } else {
                newQueryParams.set(key, value)
            }
        })
        // keep in URL only non-system-property params
        await router.replace({
            path: window.location.pathname,
            query: Object.fromEntries(newQueryParams.entries())
        })

        // resolve run mode
        const rawRunMode: string | undefined = import.meta.env.VITE_RUN_MODE
        let runMode: LabRunMode
        if (rawRunMode == undefined || rawRunMode.trim() === '' || rawRunMode === LabRunMode.Standalone) {
            runMode = LabRunMode.Standalone
        } else if (rawRunMode === LabRunMode.Driver) {
            runMode = LabRunMode.Driver
        } else {
            throw new Error(`Unsupported run mode ${rawRunMode}`)
        }

        // resolve playground mode
        const playgroundMode: boolean = newQueryParams.has('demoSnippetRequest') ||
            newQueryParams.has('sharedTab')

        return new EvitaLabConfig(runMode, playgroundMode, Immutable.Map(systemProperties));
    }

    get runMode(): LabRunMode {
        return this._runMode
    }

    /**
     * Represents editor mode where user data aren't stored at the end of the session. Useful for demo snippets or shared tabs.
     */
    get playgroundMode(): boolean {
        return this._playgroundMode
    }

    get serverName(): string {
        return this.systemProperty(serverNameSystemPropertyName) ?? defaultServerName
    }

    get readOnly(): boolean {
        const rawReadOnly: string | undefined = this.systemProperty(readOnlySystemPropertyName)
        if (rawReadOnly == undefined) {
            return false
        }
        return rawReadOnly === 'true'
    }

    systemProperty(name: string): string | undefined {
        return this.systemProperties.get(name)
    }
}

export const useEvitaLabConfig = (): EvitaLabConfig => {
    return mandatoryInject(evitaLabConfigInjectionKey) as EvitaLabConfig
}
