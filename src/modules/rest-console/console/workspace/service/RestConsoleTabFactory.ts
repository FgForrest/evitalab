import { Connection } from '@/modules/connection/model/Connection'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { mandatoryInject } from '@/utils/reactivity'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'
import { RestConsoleTabDefinition } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDefinition'
import { RestConsoleTabParams } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParams'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'
import { RestConsoleTabParamsDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParamsDto'
import { RestConsoleTabDataDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDataDto'

export const restConsoleTabFactoryInjectionKey: InjectionKey<RestConsoleTabFactory> = Symbol('restConsoleTabFactory')

/**
 * Factory for creating REST console tab definitions.
 */
export class RestConsoleTabFactory {

    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    /**
     * Creates new tab definition
     */
    createNew(connection: Connection,
              catalogName: string,
              initialData: RestConsoleTabData | undefined = undefined,
              executeOnOpen: boolean = false): RestConsoleTabDefinition {
        return new RestConsoleTabDefinition(
            this.constructTitle(connection, catalogName),
            this.createNewTabParams(connection, catalogName, executeOnOpen),
            initialData ? initialData : new RestConsoleTabData()
        )
    }

    /**
     * Creates new tab definition from serialized representation.
     */
    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): RestConsoleTabDefinition {
        const params: RestConsoleTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        const data: RestConsoleTabData = this.restoreTabDataFromSerializable(dataJson)

        return new RestConsoleTabDefinition(
            this.constructTitle(
                params.dataPointer.connection,
                params.dataPointer.catalogName
            ),
            params,
            data
        )
    }

    private constructTitle(connection: Connection, catalogName: string): string {
        return `${catalogName} [${connection.name}]`
    }

    /**
     * Creates new tab params
     */
    private createNewTabParams(connection: Connection, catalogName: string, executeOnOpen: boolean): RestConsoleTabParams {
        return new RestConsoleTabParams(
            new RestConsoleDataPointer(
                connection,
                catalogName,
            ),
            executeOnOpen
        )
    }

    /**
     * Creates new tab params from serialized representation.
     */
    private restoreTabParamsFromSerializable(json: TabParamsDto): RestConsoleTabParams {
        const dto: RestConsoleTabParamsDto = json as RestConsoleTabParamsDto
        return new RestConsoleTabParams(
            new RestConsoleDataPointer(
                this.connectionService.getConnection(dto.connectionId),
                dto.catalogName
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    /**
     * Creates new tab params from serialized representation.
     */
    private restoreTabDataFromSerializable(json?: TabDataDto): RestConsoleTabData {
        if (json == undefined) {
            return new RestConsoleTabData()
        }
        const dto: RestConsoleTabDataDto = json as RestConsoleTabDataDto
        return new RestConsoleTabData(
            dto.entityType,
            dto.operation,
            dto.query
        )
    }
}

export const useRestConsoleTabFactory = (): RestConsoleTabFactory => {
    return mandatoryInject(restConsoleTabFactoryInjectionKey) as RestConsoleTabFactory
}
