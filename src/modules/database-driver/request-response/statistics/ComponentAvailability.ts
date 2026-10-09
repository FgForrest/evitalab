/**
 * Outcome of computing one requested {@link CatalogStatisticsComponent}. Without it a client cannot tell a component
 * it never requested from one the engine could not compute - both arrive as an absent sub-message.
 */
export enum ComponentAvailability {
    /**
     * The component was requested and computed - its value is present in the snapshot.
     */
    Delivered = 'delivered',
    /**
     * The catalog is corrupted and could not be loaded, and this component reads state only a loaded catalog has.
     */
    CatalogUnusable = 'catalogUnusable',
    /**
     * The component depends on an engine feature switched off in the current configuration.
     */
    FeatureDisabled = 'featureDisabled',
    /**
     * A reason this evitaLab build does not know yet. Rendered as "unavailable" together with the server's own reason.
     */
    Unknown = 'unknown'
}
