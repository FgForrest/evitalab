import {
    DataGridDataPointer, EntityPropertyValue,
    FlatEntity,
    NativeValue,
    QueryResult,
    WritableEntityProperty
} from '@/model/editor/data-grid'
import { LabService } from '@/services/lab.service'

/**
 * Executes query against evitaDB server in language defined by implementation.
 */
export abstract class QueryExecutor {
    protected readonly labService: LabService

    protected constructor(labService: LabService) {
        this.labService = labService
    }

    /**
     * Executes a query against evitaDB server in language defined by implementation and returns formatted data.
     *
     * @param dataPointer points to a collection where to fetch data from
     * @param query pre-built query to execute in language defined by implementation
     */
    abstract executeQuery(dataPointer: DataGridDataPointer, query: string): Promise<QueryResult>

    /**
     * Creates immutable copy of entity from constructed properties
     */
    protected createFlatEntity(flattenedProperties: (WritableEntityProperty | undefined)[]): FlatEntity {
        const flattenedEntity: { [key: string]: EntityPropertyValue | EntityPropertyValue[] } = {}
        flattenedProperties.forEach(it => {
            if (it == undefined) {
                return
            }
            flattenedEntity[it[0].toString()] = it[1]
        })
        return flattenedEntity as FlatEntity
    }

    /**
     * Converts an entity property value to properly formatted {@link NativeValue} wrapper.
     * @param value a raw entity property value
     * @protected
     */
    protected wrapRawValueIntoNativeValue(value: any): NativeValue | NativeValue[] {
        if (value instanceof Array) {
            return value.map(item => new NativeValue(item))
        } else {
            return new NativeValue(value)
        }
    }
}
