import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import type { EffectScope } from 'vue'
import { useAutoReload } from '../../../src/modules/viewer-support/composable/useAutoReload'
import type { AutoReload } from '../../../src/modules/viewer-support/composable/useAutoReload'

const interval: number = 5_000
/** The first backoff step of the composable's schedule. */
const firstBackoff: number = 5_000

let scope: EffectScope | undefined = undefined

/**
 * Runs the composable inside an explicit effect scope, standing in for a component setup scope.
 */
function withScope(create: () => AutoReload): AutoReload {
    scope = effectScope()
    return scope.run(create)!
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
    scope?.stop()
    scope = undefined
    vi.useRealTimers()
})

describe('useAutoReload', () => {

    test('Should reload repeatedly on the configured interval', async () => {
        const load = vi.fn(async () => {})
        withScope(() => useAutoReload(load, interval, () => {}))

        await vi.advanceTimersByTimeAsync(0)
        expect(load).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(interval)
        expect(load).toHaveBeenCalledTimes(2)

        await vi.advanceTimersByTimeAsync(interval)
        expect(load).toHaveBeenCalledTimes(3)
    })

    // regression test for #388: a single failed poll used to kill auto-refresh for the whole
    // lifetime of the tab, leaving the list silently frozen on stale data
    test('Should retry after a failure and resume the normal interval once it succeeds', async () => {
        let fail: boolean = true
        const load = vi.fn(async () => {
            if (fail) {
                throw new Error('connection lost')
            }
        })
        const onOutage = vi.fn()
        withScope(() => useAutoReload(load, interval, onOutage))

        await vi.advanceTimersByTimeAsync(0)
        expect(load).toHaveBeenCalledTimes(1)
        expect(onOutage).toHaveBeenCalledTimes(1)

        // the loop survives the failure and retries with a backoff
        fail = false
        await vi.advanceTimersByTimeAsync(firstBackoff)
        expect(load).toHaveBeenCalledTimes(2)

        // and is back on the regular schedule afterwards
        await vi.advanceTimersByTimeAsync(interval)
        expect(load).toHaveBeenCalledTimes(3)
    })

    test('Should report an ongoing outage only once and again after a recovery', async () => {
        let fail: boolean = true
        const load = vi.fn(async () => {
            if (fail) {
                throw new Error('connection lost')
            }
        })
        const onOutage = vi.fn()
        withScope(() => useAutoReload(load, interval, onOutage))

        await vi.advanceTimersByTimeAsync(0)
        // several failed attempts, growing backoff
        await vi.advanceTimersByTimeAsync(5_000)
        await vi.advanceTimersByTimeAsync(10_000)
        await vi.advanceTimersByTimeAsync(20_000)
        expect(load).toHaveBeenCalledTimes(4)
        expect(onOutage).toHaveBeenCalledTimes(1)

        // recovery re-arms the reporting
        fail = false
        await vi.advanceTimersByTimeAsync(60_000)
        expect(onOutage).toHaveBeenCalledTimes(1)

        fail = true
        await vi.advanceTimersByTimeAsync(interval)
        expect(onOutage).toHaveBeenCalledTimes(2)
    })

    test('Should bypass a pending backoff on a manual reload', async () => {
        const load = vi.fn(async () => {
            throw new Error('connection lost')
        })
        const onOutage = vi.fn()
        const autoReload: AutoReload = withScope(() => useAutoReload(load, interval, onOutage))

        await vi.advanceTimersByTimeAsync(0)
        expect(load).toHaveBeenCalledTimes(1)

        // does not wait for the backoff, and reports the failure the user asked for
        await autoReload.reload(true)
        expect(load).toHaveBeenCalledTimes(2)
        expect(onOutage).toHaveBeenCalledTimes(2)

        // the backoff schedule restarts from its first step
        await vi.advanceTimersByTimeAsync(firstBackoff)
        expect(load).toHaveBeenCalledTimes(3)
    })

    // the lists call reload(true) from their page-number watcher, and their loader decrements the page
    // number when a page turns out to be empty — that self-triggering chain must terminate and must
    // not leave more than the single pending timer behind
    test('Should terminate a self-triggering reload chain with one pending timer', async () => {
        let pagesToDrop: number = 3
        const chain: { reload?: AutoReload['reload'] } = {}
        const autoReload: AutoReload = withScope(() => useAutoReload(
            async () => {
                if (pagesToDrop > 0) {
                    pagesToDrop--
                    // the page-number watcher flushes after the current tick, not inside the loader
                    await Promise.resolve()
                    await chain.reload!(true)
                }
            },
            interval,
            () => {}
        ))
        chain.reload = autoReload.reload

        await vi.advanceTimersByTimeAsync(0)
        expect(pagesToDrop).toEqual(0)
        expect(vi.getTimerCount()).toEqual(1)

        await vi.advanceTimersByTimeAsync(interval)
        expect(vi.getTimerCount()).toEqual(1)
    })

    test('Should stop reloading when the owning scope is disposed', async () => {
        const load = vi.fn(async () => {})
        withScope(() => useAutoReload(load, interval, () => {}))

        await vi.advanceTimersByTimeAsync(0)
        expect(load).toHaveBeenCalledTimes(1)

        scope!.stop()

        await vi.advanceTimersByTimeAsync(10 * interval)
        expect(load).toHaveBeenCalledTimes(1)
    })
})
