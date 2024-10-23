// todo docs
import { Connection } from '@/modules/connection/model/Connection'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import { EvitaQLConsoleTabParams } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabParams'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EvitaQLConsoleDataPointer } from '@/modules/evitaql-console/console/model/EvitaQLConsoleDataPointer'
import { EvitaQLConsoleTabDataDto } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDataDto'
import {
    EvitaQLConsoleTabParamsDto
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabParamsDto'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const evitaQLConsoleTabFactoryInjectionKey: InjectionKey<EvitaQLConsoleTabFactory> = Symbol('evitaQLConsoleTabFactory')

export class EvitaQLConsoleTabFactory {

    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection,
              catalogName: string,
              initialData: EvitaQLConsoleTabData | undefined = undefined,
              executeOnOpen: boolean = false): EvitaQLConsoleTabDefinition {
        return new EvitaQLConsoleTabDefinition(
            this.constructTitle(connection, catalogName),
            this.createNewTabParams(connection, catalogName, executeOnOpen),
            initialData ? initialData : new EvitaQLConsoleTabData()
        )
    }

    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): EvitaQLConsoleTabDefinition {
        const params: EvitaQLConsoleTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        const data: EvitaQLConsoleTabData = this.restoreTabDataFromSerializable(dataJson)

        return new EvitaQLConsoleTabDefinition(
            this.constructTitle(params.dataPointer.connection, params.dataPointer.catalogName),
            params,
            data
        )
    }

    private constructTitle(connection: Connection, catalogName: string): string {
        return `${catalogName} [${connection.name}]`
    }

    private createNewTabParams(connection: Connection,
                               catalogName: string,
                               executeOnOpen: boolean): EvitaQLConsoleTabParams {
        return new EvitaQLConsoleTabParams(
            new EvitaQLConsoleDataPointer(
                connection,
                catalogName
            ),
            executeOnOpen
        )
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): EvitaQLConsoleTabParams {
        const dto: EvitaQLConsoleTabParamsDto = json as EvitaQLConsoleTabParamsDto
        return new EvitaQLConsoleTabParams(
            new EvitaQLConsoleDataPointer(
                this.connectionService.getConnection(dto.connectionId),
                dto.catalogName
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    private restoreTabDataFromSerializable(json?: TabDataDto): EvitaQLConsoleTabData {
        if (json == undefined) {
            return new EvitaQLConsoleTabData()
        }
        const dto: EvitaQLConsoleTabDataDto = json as EvitaQLConsoleTabDataDto
        return new EvitaQLConsoleTabData(dto.query, dto.variables)
    }
}

export const useEvitaQLConsoleTabFactory = (): EvitaQLConsoleTabFactory => {
    return mandatoryInject(evitaQLConsoleTabFactoryInjectionKey) as EvitaQLConsoleTabFactory
}
