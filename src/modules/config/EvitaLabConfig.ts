import Cookies from 'js-cookie'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

/**
 * Cookie containing the name of a hosting server. This is mainly for namespacing storages.
 */
const providerNameCookieName: string = 'evitalab_servername'
/**
 * Cookie containing the read-only flag. This defines whether the lab is in read-only mode.
 */
const readonlyCookieName: string = 'evitalab_readonly'

const defaultName: string = 'standalone'

export const evitaLabConfigInjectionKey: InjectionKey<EvitaLabConfig> = Symbol('evitaLabConfig')

/**
 * Holds current evitaLab config
 */
export class EvitaLabConfig {
    readonly providerName: string
    readonly readOnly: boolean

    private constructor(providerName: string, readOnly: boolean) {
        this.providerName = providerName
        this.readOnly = readOnly
    }

    /**
     * Load config from cookies
     */
    static load(): EvitaLabConfig {
        const providerNameCookie: string | undefined = Cookies.get(providerNameCookieName)
        const providerName: string = providerNameCookie != undefined ? atob(providerNameCookie) : defaultName

        const readOnlyCookie: string | undefined = Cookies.get(readonlyCookieName)
        const readOnly: boolean = readOnlyCookie != undefined && atob(readOnlyCookie) === 'true'

        // expire cookies, so when the lab is reloaded, it will load new cookie values
        Cookies.remove(providerNameCookieName)
        Cookies.remove(readonlyCookieName)

        return new EvitaLabConfig(providerName, readOnly);
    }
}

export const useEvitaLabConfig = (): EvitaLabConfig => {
    return mandatoryInject(evitaLabConfigInjectionKey) as EvitaLabConfig
}
