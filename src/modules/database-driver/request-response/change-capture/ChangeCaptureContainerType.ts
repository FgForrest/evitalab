/**
 * The container type describes internal evitaDB data structures.
 */
export enum ChangeCaptureContainerType {
    /**
     * Catalog - similar to relational database schema.
     */
    ContainerCatalog = 'containerCatalog',
    /**
     * Entity - similar to relational database table (or better - set of inter-related tables).
     */
    ContainerEntity = 'containerEntity',
    /**
     * Attribute - similar to relational database column.
     */
    ContainerAttribute = 'containerAttribute',
    /**
     * Associated data - similar to an unstructured JSON document in relational database column.
     */
    ContainerAssociatedData = 'containerAssociatedData',
    /**
     * Price - fixed structure data type, could be represented as row in a specialized table in relational database.
     */
    ContainerPrice = 'containerPrice',
    /**
     * Reference - similar to a foreign key in relational database or a binding table in many-to-many relationship.
     */
    ContainerReference = 'containerReference'
}