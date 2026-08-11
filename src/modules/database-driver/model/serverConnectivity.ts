/**
 * Whether the evitaDB server is currently reachable, as observed by the driver — evitaLab's "offline mode" —
 * together with the outage reporting round the notification layer suppresses duplicate reports by.
 *
 * Both transitions are observed at real funnels rather than inferred: *unreachable* at {@link ErrorTransformer}
 * and at the gRPC transport interceptor, *reachable* at either transport seeing the server answer — the gRPC
 * interceptor and the `afterResponse` hook of the client's ky instance. Both are needed: a session spent
 * entirely in a GraphQL console produces no gRPC traffic at all, and would otherwise stay latched offline
 * after a single transient fetch failure.
 *
 * Module-scoped on purpose: `ErrorTransformer` is constructed per client with no access to the notification
 * module, and neither module should depend on the other for one boolean and a counter.
 *
 * See the module documentation for the full rationale.
 */

import { readonly, ref, type Ref } from 'vue'

/**
 * Reactive so the UI can badge the offline state directly; see {@link serverUnreachableState}.
 */
const serverUnreachable: Ref<boolean> = ref(false)
const serverUnreachableReadonly: Readonly<Ref<boolean>> = readonly(serverUnreachable)
let outageReportingRound: number = 0

/**
 * Records that the server could not be reached, starting a new outage episode if it was previously reachable.
 */
export function markServerUnreachable(): void {
    if (!serverUnreachable.value) {
        serverUnreachable.value = true
        outageReportingRound++
    }
}

/**
 * Records that the server answered, ending any outage.
 */
export function markServerReachable(): void {
    serverUnreachable.value = false
}

/**
 * Whether the driver currently believes the server cannot be reached.
 */
export function isServerUnreachable(): boolean {
    return serverUnreachable.value
}

/**
 * Reactive view of the offline state, for the UI to badge it. Read-only — only the driver funnels above may
 * change it.
 */
export function serverUnreachableState(): Readonly<Ref<boolean>> {
    return serverUnreachableReadonly
}

/**
 * Asks for the next connectivity failure to be reported even if the ongoing outage already was.
 *
 * Called by the **user-initiated** refresh paths (the connection explorer's *Reload*, the schema viewer's and
 * GraphQL console's reload buttons). Somebody who explicitly asks for fresh data deserves an answer, whereas the
 * background retries and pollers that produce most of an outage's failures do not — which is exactly why this is
 * an explicit call from those few places rather than anything automatic.
 */
export function requestOutageReport(): void {
    outageReportingRound++
}

/**
 * Identifier of the current reporting round: advances with every new outage and with every
 * {@link requestOutageReport}.
 */
export function currentOutageReportingRound(): number {
    return outageReportingRound
}

/**
 * Restores the initial state. For tests only.
 */
export function resetServerConnectivity(): void {
    serverUnreachable.value = false
    outageReportingRound = 0
}
