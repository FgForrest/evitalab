import { describe, test, expect, vi } from 'vitest'
import { EvitaServerMetadataCache } from '../../../src/modules/database-driver/EvitaServerMetadataCache'
import { ServerStatus } from '../../../src/modules/database-driver/request-response/status/ServerStatus'
import { EngineSettings } from '../../../src/modules/database-driver/request-response/status/EngineSettings'

// The cache only stores and hands back whatever its accessors return, so a lightweight stub cast to
// ServerStatus is enough to exercise the caching/refresh logic without building a full instance.
function serverStatus(version: string): ServerStatus {
    return { version } as unknown as ServerStatus
}

function engineSettings(): EngineSettings {
    return {} as unknown as EngineSettings
}

describe('EvitaServerMetadataCache', () => {

    test('clear() resets cached status/configuration and invokes both callback sets', async () => {
        const cache = new EvitaServerMetadataCache(
            async () => serverStatus('1.0'),
            async () => 'config',
            async () => engineSettings()
        )
        // populate both caches
        await cache.getLatestServerStatus()
        await cache.getLatestConfiguration()

        const serverStatusCallback = vi.fn(async () => {})
        const configurationCallback = vi.fn(async () => {})
        cache.registerServerStatusChangeCallback(serverStatusCallback)
        cache.registerConfigurationChangeCallback(configurationCallback)

        await cache.clear()

        expect(serverStatusCallback).toHaveBeenCalledTimes(1)
        expect(configurationCallback).toHaveBeenCalledTimes(1)
    })

    test('engine settings are cached until the cache is cleared', async () => {
        const accessor = vi.fn()
            .mockResolvedValueOnce(engineSettings())
            .mockResolvedValueOnce(engineSettings())
        const cache = new EvitaServerMetadataCache(
            async () => serverStatus('1.0'),
            async () => 'config',
            accessor
        )

        await cache.getLatestEngineSettings()
        await cache.getLatestEngineSettings()
        expect(accessor).toHaveBeenCalledTimes(1)

        await cache.clear()

        await cache.getLatestEngineSettings()
        expect(accessor).toHaveBeenCalledTimes(2)
    })

    test('a failed status accessor call is not sticky - the next getLatestServerStatus() retries', async () => {
        const accessor = vi.fn()
            .mockRejectedValueOnce(new Error('server down'))
            .mockResolvedValueOnce(serverStatus('1.0'))
        const cache = new EvitaServerMetadataCache(
            accessor,
            async () => 'config',
            async () => engineSettings()
        )

        await expect(cache.getLatestServerStatus()).rejects.toThrow('server down')
        // no sticky failure: the cache stays empty and fetches fresh on the next call
        await expect(cache.getLatestServerStatus()).resolves.toEqual(serverStatus('1.0'))
        expect(accessor).toHaveBeenCalledTimes(2)
    })

    test('a failed configuration accessor call is not sticky', async () => {
        const accessor = vi.fn()
            .mockRejectedValueOnce(new Error('server down'))
            .mockResolvedValueOnce('config')
        const cache = new EvitaServerMetadataCache(
            async () => serverStatus('1.0'),
            accessor,
            async () => engineSettings()
        )

        await expect(cache.getLatestConfiguration()).rejects.toThrow('server down')
        await expect(cache.getLatestConfiguration()).resolves.toEqual('config')
        expect(accessor).toHaveBeenCalledTimes(2)
    })

    test('refreshServerStatus() fetches fresh data, updates the cache and fires status callbacks', async () => {
        const accessor = vi.fn()
            .mockResolvedValueOnce(serverStatus('1.0'))
            .mockResolvedValueOnce(serverStatus('2.0'))
        const cache = new EvitaServerMetadataCache(
            accessor,
            async () => 'config',
            async () => engineSettings()
        )
        await cache.getLatestServerStatus()

        const serverStatusCallback = vi.fn(async () => {})
        const configurationCallback = vi.fn(async () => {})
        cache.registerServerStatusChangeCallback(serverStatusCallback)
        cache.registerConfigurationChangeCallback(configurationCallback)

        const refreshed = await cache.refreshServerStatus()

        expect(refreshed).toEqual(serverStatus('2.0'))
        // subsequent cached read returns the refreshed value
        await expect(cache.getLatestServerStatus()).resolves.toEqual(serverStatus('2.0'))
        expect(serverStatusCallback).toHaveBeenCalledTimes(1)
        // refreshing status must not touch configuration callbacks
        expect(configurationCallback).not.toHaveBeenCalled()
    })

    test('refreshServerStatus() propagates errors, keeps the previous value and fires no callbacks', async () => {
        const accessor = vi.fn()
            .mockResolvedValueOnce(serverStatus('1.0'))
            .mockRejectedValueOnce(new Error('server down'))
        const cache = new EvitaServerMetadataCache(
            accessor,
            async () => 'config',
            async () => engineSettings()
        )
        await cache.getLatestServerStatus()

        const serverStatusCallback = vi.fn(async () => {})
        cache.registerServerStatusChangeCallback(serverStatusCallback)

        await expect(cache.refreshServerStatus()).rejects.toThrow('server down')
        expect(serverStatusCallback).not.toHaveBeenCalled()
        // previous cached value is retained (no extra accessor call needed)
        await expect(cache.getLatestServerStatus()).resolves.toEqual(serverStatus('1.0'))
        expect(accessor).toHaveBeenCalledTimes(2)
    })

    test('refreshConfiguration() fetches fresh data, updates the cache and fires configuration callbacks', async () => {
        const accessor = vi.fn()
            .mockResolvedValueOnce('config-1')
            .mockResolvedValueOnce('config-2')
        const cache = new EvitaServerMetadataCache(
            async () => serverStatus('1.0'),
            accessor,
            async () => engineSettings()
        )
        await cache.getLatestConfiguration()

        const serverStatusCallback = vi.fn(async () => {})
        const configurationCallback = vi.fn(async () => {})
        cache.registerServerStatusChangeCallback(serverStatusCallback)
        cache.registerConfigurationChangeCallback(configurationCallback)

        const refreshed = await cache.refreshConfiguration()

        expect(refreshed).toEqual('config-2')
        await expect(cache.getLatestConfiguration()).resolves.toEqual('config-2')
        expect(configurationCallback).toHaveBeenCalledTimes(1)
        expect(serverStatusCallback).not.toHaveBeenCalled()
    })

    test('refreshConfiguration() propagates errors, keeps the previous value and fires no callbacks', async () => {
        const accessor = vi.fn()
            .mockResolvedValueOnce('config-1')
            .mockRejectedValueOnce(new Error('server down'))
        const cache = new EvitaServerMetadataCache(
            async () => serverStatus('1.0'),
            accessor,
            async () => engineSettings()
        )
        await cache.getLatestConfiguration()

        const configurationCallback = vi.fn(async () => {})
        cache.registerConfigurationChangeCallback(configurationCallback)

        await expect(cache.refreshConfiguration()).rejects.toThrow('server down')
        expect(configurationCallback).not.toHaveBeenCalled()
        await expect(cache.getLatestConfiguration()).resolves.toEqual('config-1')
        expect(accessor).toHaveBeenCalledTimes(2)
    })
})
