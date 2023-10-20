import { DataGridDataPointer, EntityPropertyKey } from '@/model/editor/data-grid'
import { AttributeSchemaUnion } from '@/model/evitadb'

/**
 * Builds query from arguments based on language of implementation.
 */
export interface QueryBuilder {

    /**
     * Builds query from arguments based on language of implementation.
     *
     * @param dataPointer points to collection where to fetch data from
     * @param filterBy filter by part of query in language of implementation
     * @param orderBy order by part of query in language of implementation
     * @param dataLocale locale of data in query, if undefined, only global data are returned
     * @param requiredData defines which data should be fetched from collection as entity fields
     * @param pageNumber page number of query result
     * @param pageSize page size of query result
     */
    buildQuery(dataPointer: DataGridDataPointer,
               filterBy: string,
               orderBy: string,
               dataLocale: string | undefined,
               requiredData: EntityPropertyKey[],
               pageNumber: number,
               pageSize: number): Promise<string>

    /**
     * Builds single attributeNatural order constraint in language of implementation for order by clause.
     *
     * @param attributeSchema attribute schema to build constraint for
     * @param orderDirection direction of order by clause
     */
    buildAttributeOrderBy(attributeSchema: AttributeSchemaUnion, orderDirection: string): string

    /**
     * Builds single entityPrimaryKeyInSet filter constraint in language of implementation for filter by clause of a parent entity.
     *
     * @param parentPrimaryKey primary key of parent entity
     */
    buildParentEntityFilterBy(parentPrimaryKey: number): string

    /**
     * Builds filter by clause to find referenced entities by their primary keys in the same collection as successor entity.
     *
     * @param predecessorPrimaryKey primary key of predecessor entity
     */
    buildPredecessorEntityFilterBy(predecessorPrimaryKey: number): string

    /**
     * Builds single entityPrimaryKeyInSet filter constraint in language of implementation for filter by clause of a referenced
     * collection.
     *
     * @param referencedPrimaryKeys primary keys of referenced entities
     */
    buildReferencedEntityFilterBy(referencedPrimaryKeys: number | number[]): string
}
