/**
 * The container type describes internal evitaDB data structures.
 * String enum equivalent of GrpcChangeCaptureContainerType
 */
export enum ChangeCaptureContainerType {
    /**
     * Catalog - similar to relational database schema.
     */
    Catalog = 'catalog',
    /**
     * Entity - similar to relational database table (or better - set of inter-related tables).
     */
    Entity = 'entity',
    /**
     * Attribute - similar to relational database column.
     */
    Attribute = 'attribute',
    /**
     * Associated data - similar to an unstructured JSON document in relational database column.
     */
    AssociatedData = 'associatedData',
    /**
     * Price - fixed structure data type, could be represented as row in a specialized table in relational database.
     */
    Price = 'price',
    /**
     * Reference - similar to a foreign key in relational database or a binding table in many-to-many relationship.
     */
    Reference = 'reference'
}
