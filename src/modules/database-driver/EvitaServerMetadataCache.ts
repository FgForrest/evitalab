import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { v4 as uuidv4 } from 'uuid'

/**
 * This class is a registry for previously fetched server metadata to avoid excessive fetching
 * from the client.
 */
export class EvitaServerMetadataCache {

    private _serverStatus: ServerStatus | undefined = undefined;
    private readonly serverStatusChangeCallbacks: Map<string, () => Promise<void>> = new Map()
    private readonly serverStatusAccessor: () => Promise<ServerStatus>

    private _configuration: string | undefined = undefined;
    private readonly configurationChangeCallbacks: Map<string, () => Promise<void>> = new Map()
    private readonly configurationAccessor: () => Promise<string>

    constructor(
        serverStatusAccessor: () => Promise<ServerStatus>,
        configurationAccessor: () => Promise<string>
    ) {
        this.serverStatusAccessor = serverStatusAccessor;
        this.configurationAccessor = configurationAccessor;
    }

    async clear(): Promise<void> {
        this._serverStatus = undefined;
        for (const callback of this.serverStatusChangeCallbacks.values()) {
            await callback()
        }

        this._configuration = undefined;
        for (const callback of this.configurationChangeCallbacks.values()) {
            await callback()
        }
    }

    registerServerStatusChangeCallback(callback: () => Promise<void>): string {
        const id = uuidv4()
        this.serverStatusChangeCallbacks.set(id, callback)
        return id
    }

    unregisterServerStatusChangeCallback(id: string): void {
        this.serverStatusChangeCallbacks.delete(id)
    }

    async getLatestServerStatus(): Promise<ServerStatus> {
        if (this._serverStatus == undefined) {
            this._serverStatus = await this.serverStatusAccessor()
        }
        return this._serverStatus
    }

    registerConfigurationChangeCallback(callback: () => Promise<void>): string {
        const id = uuidv4()
        this.configurationChangeCallbacks.set(id, callback)
        return id
    }

    unregisterConfigurationChangeCallback(id: string): void {
        this.configurationChangeCallbacks.delete(id)
    }

    async getLatestConfiguration(): Promise<string> {
        if (this._configuration == undefined) {
            this._configuration = await this.configurationAccessor()
        }

        return this._configuration
    }

}
