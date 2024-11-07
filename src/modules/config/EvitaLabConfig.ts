import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import Immutable from 'immutable'
import { Router } from 'vue-router'

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

    private readonly systemProperties: Immutable.Map<string, string>

    private constructor(systemProperties: Immutable.Map<string, string>) {
        this.systemProperties = systemProperties
    }

    /**
     * Load config
     */
    static load(router: Router): EvitaLabConfig {
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
        router.replace({
            path: window.location.pathname,
            query: Object.fromEntries(newQueryParams.entries())
        })

        return new EvitaLabConfig(Immutable.Map(systemProperties));
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
