import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { List } from 'immutable'

/**
 * Executes query against evitaDB server in language defined by implementation.
 */
export abstract class QueryExecutor {
    protected readonly connectionService: ConnectionService

    protected constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    /**
     * Executes a query against evitaDB server in language defined by implementation and returns formatted data.
     *
     * @param dataPointer points to a collection where to fetch data from
     * @param query pre-built query to execute in language defined by implementation
     */
    abstract executeQuery(dataPointer: EntityViewerDataPointer, query: string): Promise<QueryResult>

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
    protected wrapRawValueIntoNativeValue(value: any | undefined): NativeValue | NativeValue[] {
        if (value instanceof Array) {
            return value.map(item => new NativeValue(item))
        } else if(value instanceof List) {
            return (value as List<any>).map(x => new NativeValue(x)).toArray();
        } else {
            return new NativeValue(value)
        }
    }
}
