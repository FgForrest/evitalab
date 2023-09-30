import store from 'store2'
import { EvitaDBConnection } from '@/model/lab'

/**
 * Actual storage version of the current build.
 *
 * Represents a version of lab storage. Used to indicate with which versions of the lab this storage is compatible.
 * Because every new version requires empty storage, this version should be increased only with breaking changes
 * to storage format.
 */
const buildVersion = 2

/**
 * Actual supported lab storage items. These are supported only by the current version of the lab.
 */
enum LabStorageVersionedItemType {
    UserConnections = 'userConnections',
    // todo lho implement, just a mockup
    // Tabs = 'tabs',
    // Settings = 'settings'
}

/**
 * System-wide manager of storage. Used for all data that need to be persisted between lab starts (connections, settings, ...).
 */
export class LabStorage {
    readonly storage: any

    constructor(serverName: string) {
        // obtain storage for the current build version a namespace
        this.storage = store.namespace('evitaLab:' + btoa(serverName) + ":" + buildVersion)
    }

    /**
     * Retrieves stored user connections from the storage.
     */
    getUserConnections(): EvitaDBConnection[] {
        try {
            const storedUserConnections = this.storage.get(LabStorageVersionedItemType.UserConnections)
            if (storedUserConnections == undefined) {
                return []
            }
            return JSON.parse(storedUserConnections) as EvitaDBConnection[]
        } catch (e) {
            console.error('Failed to load user connections from local storage. Creating new collection...', e)
            return []
        }
    }

    /**
     * Store new user connections to the storage.
     */
    storeUserConnections(userConnections: EvitaDBConnection[]): void {
        this.storage.set(LabStorageVersionedItemType.UserConnections, this.stringifyItem(userConnections), true)
    }

    private stringifyItem(item: any) {
        if (item instanceof Object) {
            return JSON.stringify(item)
        } else {
            return item.toString()
        }
    }
}
