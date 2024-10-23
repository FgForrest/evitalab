import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { OrderDirection } from '@/modules/connection/model/schema/OrderDirection'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'

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
     * @param priceType price type of data in query, undefined if the target collection doesn't support prices
     * @param requiredData defines which data should be fetched from collection as entity fields
     * @param pageNumber page number of query result
     * @param pageSize page size of query result
     */
    buildQuery(dataPointer: EntityViewerDataPointer,
               filterBy: string,
               orderBy: string,
               dataLocale: string | undefined,
               priceType: QueryPriceMode | undefined,
               requiredData: EntityPropertyKey[],
               pageNumber: number,
               pageSize: number): Promise<string>

    /**
     * Builds single entityPrimaryKeyNatural order constraint in language of implementation for order by clause.
     *
     * @param orderDirection direction of order by clause
     */
    buildPrimaryKeyOrderBy(orderDirection: OrderDirection): string

    /**
     * Builds single attributeNatural order constraint in language of implementation for order by clause.
     *
     * @param attributeSchema attribute schema to build constraint for
     * @param orderDirection direction of order by clause
     */
    buildAttributeOrderBy(attributeSchema: AttributeSchema, orderDirection: OrderDirection): string

    /**
     * Builds a single attributeNatural order constraint wrapped within referenceProperty in language of implementation
     * for order by clause.
     *
     * @param referenceSchema parent reference schema of the attribute
     * @param attributeSchema attribute schema to build constraint for
     * @param orderDirection direction of order by clause
     */
    buildReferenceAttributeOrderBy(referenceSchema: ReferenceSchema, attributeSchema: AttributeSchema, orderDirection: OrderDirection): string

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

    /**
     * Builds filter by clause to compute priceForSale of an entity.
     *
     * @param entityPrimaryKey primary key of entity for which to compute priceForSale
     * @param priceLists price lists to use for computation, order is important
     * @param currency currency to use for computation
     */
    buildPriceForSaleFilterBy(entityPrimaryKey: number, priceLists: string[], currency: string): string
}
