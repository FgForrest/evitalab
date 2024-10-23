import store, { StoreBase } from 'store2'
import XXH, { HashObject } from 'xxhashjs'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

const hasher: HashObject = XXH.h64()

/**
 * Actual storage version of the current build.
 *
 * Represents a version of lab storage. Used to indicate with which versions of the lab this storage is compatible.
 * Because every new version requires empty storage, this version should be increased only with breaking changes
 * to storage format.
 */
const buildVersion: number = 3

export const labStorageInjectionKey: InjectionKey<LabStorage> = Symbol('labStorage')

/**
 * System-wide manager of storage. Used for all data that need to be persisted between lab starts (connections, settings, ...).
 */
export class LabStorage {
    private readonly storage: StoreBase

    constructor(providerName: string) {
        // obtain storage for the current build version a namespace
        this.storage = store.namespace(`evitaLab:${hasher.update(providerName).digest().toString(16)}:${buildVersion}`)
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

export const useLabStorage = (): LabStorage => {
    return mandatoryInject(labStorageInjectionKey) as LabStorage
}
