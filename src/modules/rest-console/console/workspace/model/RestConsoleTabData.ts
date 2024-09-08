import { TabData } from '@/modules/workspace/tab/model/TabData'
import { RestConsoleTabDataDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDataDto'
import { RestOperationType } from '@/modules/rest-console/console/model/RestOperationType'

/**
 * Represents injectable/storable user data of the RestConsole component.
 */
export class RestConsoleTabData implements TabData<RestConsoleTabDataDto> {
    readonly entityType?: string
    readonly operation?: RestOperationType
    readonly query?: string

    constructor(entityType?: string, operation?: RestOperationType, query?: string) {
        this.entityType = entityType
        this.operation = operation
        this.query = query
    }

    toSerializable(): RestConsoleTabDataDto {
        return {
            entityType: this.entityType,
            operation: this.operation,
            query: this.query
        }
    }
}
