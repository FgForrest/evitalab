import store, { StoreBase } from 'store2'
import XXH from 'xxhashjs'

/**
 * Actual storage version of the current build.
 *
 * Represents a version of lab storage. Used to indicate with which versions of the lab this storage is compatible.
 * Because every new version requires empty storage, this version should be increased only with breaking changes
 * to storage format.
 */
const buildVersion = 2

/**
 * System-wide manager of storage. Used for all data that need to be persisted between lab starts (connections, settings, ...).
 */
export class LabStorage {
    private readonly storage: StoreBase

    constructor(serverName: string) {
        // obtain storage for the current build version a namespace
        this.storage = store.namespace(`evitaLab:${XXH.h64(serverName, Math.random()).toString(16)}:${buildVersion}`)
    }

    get<V>(key: string, def?: V): V {
        return this.storage.get(key) || def
    }

    set(key: string, value: any): void {
        this.storage.set(key, value, true)
    }

    remove(key: string): void {
        this.storage.remove(key)
    }
}
