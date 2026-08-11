/**
 * Whether what evitaLab currently serves has been verified against the server.
 *
 * This is a property of the **client's data as a whole**, not of an individual record: a reading component
 * never learns where its data came from (that is what keeps cached and live reads indistinguishable), so the
 * signal exists solely to let the UI badge the situation uniformly.
 */
export enum DataFreshness {
    /**
     * Everything served so far either came from the server or was confirmed against it. The normal state,
     * including a completely cold start against a healthy server.
     */
    Live = 'live',
    /**
     * At least one value restored from the on-disk cache **could not be verified** against the server, so
     * what the user sees may be outdated.
     *
     * Deliberately *not* entered for the brief moment between a disk hit and its successful revalidation:
     * that would flash the badge on every healthy startup and teach users to ignore it. The state means "we
     * tried to verify and failed", not "this came from disk".
     */
    Cached = 'cached'
}
