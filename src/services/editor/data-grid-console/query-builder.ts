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
     * Builds single attributeNatural constraint in language of implementation for order by clause.
     *
     * @param attributeSchema attribute schema to build constraint for
     * @param orderDirection direction of order by clause
     */
    buildAttributeNaturalConstraint(attributeSchema: AttributeSchemaUnion, orderDirection: string): string
}
