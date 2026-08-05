import { onScopeDispose } from 'vue'

/**
 * Backoff schedule in milliseconds used after a failed load, capped at the last value. Mirrors the
 * reconnect schedule of the change-stream refresher so evitaLab has a single backoff idiom.
 */
const reloadBackoff: number[] = [5_000, 10_000, 20_000, 60_000]

/**
 * Periodic reload loop shared by the server-data viewer lists.
 */
export interface AutoReload {
    /**
     * Loads the data and re-arms the loop. A manual reload bypasses any pending backoff and restarts
     * the regular schedule.
     */
    reload(manual?: boolean): Promise<void>
}

/**
 * Runs the given loader periodically and keeps the loop alive across transient failures — a dropped
 * connection, a restarted server or a suspended machine must not leave the list silently frozen on
 * stale data, which is what an unconditional stop on the first failure used to do.
 *
 * Failures are retried with a capped backoff and reported through `onOutage` **at most once per
 * outage**, so a server that stays down does not spam the user. The next successful load (or an
 * explicit manual reload) re-arms the reporting.
 *
 * The loop starts immediately and is cleared when the surrounding effect scope is disposed — the
 * setup scope of the owning component — therefore this composable must be called from a component
 * setup (or an explicit effect scope in tests).
 *
 * @param load loads the data; must throw when the load fails
 * @param interval milliseconds between two successful loads
 * @param onOutage called with the offending error on the first failure of an outage
 */
export function useAutoReload(
    load: () => Promise<void>,
    interval: number,
    onOutage: (error: unknown) => void
): AutoReload {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
    let consecutiveFailures: number = 0
    let outageReported: boolean = false

    function scheduleNext(delay: number): void {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => void reload(), delay)
    }

    async function reload(manual: boolean = false): Promise<void> {
        if (manual) {
            // an explicit request must not wait for a pending backoff, and the user deserves to hear
            // about a failure they asked for
            clearTimeout(timeoutId)
            consecutiveFailures = 0
            outageReported = false
        }

        try {
            await load()
            consecutiveFailures = 0
            outageReported = false
            scheduleNext(interval)
        } catch (e) {
            if (!outageReported) {
                outageReported = true
                onOutage(e)
            }
            const backoff: number = reloadBackoff[
                Math.min(consecutiveFailures, reloadBackoff.length - 1)
            ] ?? reloadBackoff[reloadBackoff.length - 1]!
            consecutiveFailures++
            scheduleNext(backoff)
        }
    }

    onScopeDispose(() => clearTimeout(timeoutId))

    void reload()

    return { reload }
}
