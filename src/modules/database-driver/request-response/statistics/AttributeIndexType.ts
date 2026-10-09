/**
 * Which of an attribute's index structures a cardinality reading describes.
 */
export enum AttributeIndexType {
    Unique = 'unique',
    Filter = 'filter',
    Sort = 'sort'
}
