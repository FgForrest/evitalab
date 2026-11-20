import type { InjectionKey } from 'vue'
import { Connection } from '@/modules/connection/model/Connection'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import { mandatoryInject } from '@/utils/reactivity'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'
import { RestConsoleTabDefinition } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDefinition'
import { RestConsoleTabParams } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParams'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'
import type { RestConsoleTabParamsDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParamsDto'
import type { RestConsoleTabDataDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDataDto'

export const restConsoleTabFactoryInjectionKey: InjectionKey<RestConsoleTabFactory> = Symbol('restConsoleTabFactory')

/**
 * Factory for creating REST console tab definitions.
 */
export class RestConsoleTabFactory implements TabFactory {

    readonly tabType: TabType = TabType.RestConsole
    readonly restorable: boolean = true

    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    /**
     * Creates new tab definition
     */
    createNew(
        catalogName: string,
        instanceType: RestInstanceType,
        initialData: RestConsoleTabData | undefined = undefined,
        executeOnOpen: boolean = false
    ): RestConsoleTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new RestConsoleTabDefinition(
            this.constructTitle(catalogName, instanceType),
            new RestConsoleTabParams(new RestConsoleDataPointer(connection, catalogName, instanceType), executeOnOpen),
            initialData ?? new RestConsoleTabData()
        )
    }

    /**
     * Creates new tab definition from serialized representation.
     */
    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): RestConsoleTabDefinition {
        const paramsDto: RestConsoleTabParamsDto = paramsJson as RestConsoleTabParamsDto
        const params: RestConsoleTabParams = new RestConsoleTabParams(
            new RestConsoleDataPointer(
                this.connectionService.getConnection(paramsDto.connectionId),
                paramsDto.catalogName,
                paramsDto.instanceType
            ),
            // a restored tab never executes on open: there may be many of them, and a shared link may carry a
            // mutation
            false
        )
        const dataDto: RestConsoleTabDataDto | undefined = dataJson as RestConsoleTabDataDto | undefined
        const data: RestConsoleTabData = dataDto == undefined
            ? new RestConsoleTabData()
            : new RestConsoleTabData(
                dataDto.operationId,
                dataDto.method,
                dataDto.pathTemplate,
                dataDto.locale,
                dataDto.parameters,
                dataDto.body
            )
        return new RestConsoleTabDefinition(
            this.constructTitle(params.dataPointer.catalogName, params.dataPointer.instanceType),
            params,
            data
        )
    }

    private constructTitle(catalogName: string, instanceType: RestInstanceType): string {
        return instanceType === RestInstanceType.System ? instanceType : catalogName
    }
}

export const useRestConsoleTabFactory = (): RestConsoleTabFactory => {
    return mandatoryInject(restConsoleTabFactoryInjectionKey) as RestConsoleTabFactory
}
