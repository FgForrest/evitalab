/**
 * Type of a specific evitaDB REST API instance.
 */
export enum RestInstanceType {
    /**
     * REST API of a single catalog (`/rest/<catalogName>`).
     */
    Catalog = 'catalog',
    /**
     * System REST API (`/rest/system`), not bound to any catalog.
     */
    System = 'system'
}
