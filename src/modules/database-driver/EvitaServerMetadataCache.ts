import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { EngineSettings } from '@/modules/database-driver/request-response/status/EngineSettings'
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

    /**
     * Engine settings are constant for the lifetime of the server process, so there is nothing to observe -
     * unlike the two values above they carry no change callbacks and are only dropped when the whole cache
     * is cleared on reconnect.
     */
    private _engineSettings: EngineSettings | undefined = undefined;
    private readonly engineSettingsAccessor: () => Promise<EngineSettings>

    constructor(
        serverStatusAccessor: () => Promise<ServerStatus>,
        configurationAccessor: () => Promise<string>,
        engineSettingsAccessor: () => Promise<EngineSettings>
    ) {
        this.serverStatusAccessor = serverStatusAccessor;
        this.configurationAccessor = configurationAccessor;
        this.engineSettingsAccessor = engineSettingsAccessor;
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

        this._engineSettings = undefined;
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

    /**
     * Fetches fresh server status from the server, swaps the cached value and notifies registered
     * server-status change callbacks. On fetch failure the exception propagates and neither the
     * cached value nor the callbacks are touched.
     */
    async refreshServerStatus(): Promise<ServerStatus> {
        const serverStatus: ServerStatus = await this.serverStatusAccessor()
        this._serverStatus = serverStatus
        for (const callback of this.serverStatusChangeCallbacks.values()) {
            await callback()
        }
        return serverStatus
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

    /**
     * Fetches fresh configuration from the server, swaps the cached value and notifies registered
     * configuration change callbacks. On fetch failure the exception propagates and neither the
     * cached value nor the callbacks are touched.
     */
    async refreshConfiguration(): Promise<string> {
        const configuration: string = await this.configurationAccessor()
        this._configuration = configuration
        for (const callback of this.configurationChangeCallbacks.values()) {
            await callback()
        }
        return configuration
    }

    async getLatestEngineSettings(): Promise<EngineSettings> {
        if (this._engineSettings == undefined) {
            this._engineSettings = await this.engineSettingsAccessor()
        }

        return this._engineSettings
    }

}
