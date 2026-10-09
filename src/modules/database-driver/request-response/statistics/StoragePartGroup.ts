/**
 * Which kind of data one storage-part type holds — the classification a composition table groups by.
 *
 * The engine reports a storage part by its class name, and that is an **open** set: a new index structure adds a
 * new name, and nothing in a name says what the name is (two of the engine's index parts carry no `Index` in
 * theirs). This set is **closed** on purpose — a new part type lands in an existing group — so a build that knows
 * these fourteen values keeps rendering a correct breakdown against a newer server.
 *
 * The index groups mirror the data groups deliberately: {@link AttributeIndex} against {@link AttributeData},
 * {@link PriceIndex} against {@link PriceData}, {@link ReferenceIndex} against {@link ReferenceData}. The pair is
 * what states what indexing a feature costs against what storing it costs.
 */
export enum StoragePartGroup {
    /**
     * The entity's own record — primary key, scope, locales, parent and the manifest of the parts it owns.
     */
    EntityBody = 'entityBody',
    /**
     * Attribute values as stored, one record per entity and locale.
     */
    AttributeData = 'attributeData',
    /**
     * Associated data values as stored. Usually the largest data group.
     */
    AssociatedData = 'associatedData',
    /**
     * Prices as stored, one record per entity.
     */
    PriceData = 'priceData',
    /**
     * References to other entities as stored, including their own attributes.
     */
    ReferenceData = 'referenceData',
    /**
     * An index's own record rather than the values it indexes. Deliberately small, which is why it is a poor proxy
     * for the index footprint.
     */
    IndexManifest = 'indexManifest',
    /**
     * Everything built because an attribute is filterable, sortable, unique or part of a sortable compound.
     */
    AttributeIndex = 'attributeIndex',
    /**
     * Everything built to answer price-based filtering and ordering.
     */
    PriceIndex = 'priceIndex',
    /**
     * Everything built to resolve references between entities. Faceting is charged separately.
     */
    ReferenceIndex = 'referenceIndex',
    /**
     * The facet index — charged apart from {@link ReferenceIndex} because `faceted` and `indexed` are separate
     * schema decisions.
     */
    FacetIndex = 'facetIndex',
    /**
     * The tree structure a hierarchical collection is queried through.
     */
    HierarchyIndex = 'hierarchyIndex',
    /**
     * The bucketed histogram indexes a *reference schema* declares. Named for the reference on purpose — the
     * `attributeHistogram` and `priceHistogram` extra results persist nothing and can never appear here.
     */
    ReferenceHistogramIndex = 'referenceHistogramIndex',
    /**
     * The catalog schema and one entity schema per collection.
     */
    Schema = 'schema',
    /**
     * Header records the data store keeps to describe itself and its collections.
     */
    Header = 'header'
}
