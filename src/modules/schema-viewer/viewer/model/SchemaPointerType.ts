/**
 * Defines supported pointer type for serialization.
 */
export enum SchemaPointerType {
    CatalogSchema = 'catalogSchema',
    EntitySchema = 'entitySchema',
    CatalogAttributeSchema = 'catalogAttributeSchema',
    EntityAttributeSchema = 'entityAttributeSchema',
    ReferenceAttributeSchema = 'referenceAttributeSchema',
    AssociatedDataSchema = 'associatedDataSchema',
    ReferenceSchema = 'referenceSchema',
}
