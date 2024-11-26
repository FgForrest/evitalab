import { InjectionKey } from 'vue'
import { Connection } from '@/modules/connection/model/Connection'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { EntityViewerTabParams } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabParams'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EntityViewerTabDefinition } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition'
import { EntityViewerTabParamsDto } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabParamsDto'
import { EntityViewerTabDataDto } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDataDto'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { mandatoryInject } from '@/utils/reactivity'

export const entityViewerTabFactoryInjectionKey: InjectionKey<EntityViewerTabFactory> = Symbol('entityViewerTabFactory')

// todo docs
export class EntityViewerTabFactory {

    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection,
              catalogName: string,
              entityType: string,
              initialData: EntityViewerTabData | undefined = undefined,
              executeOnOpen: boolean = false): EntityViewerTabDefinition {
        return new EntityViewerTabDefinition(
            this.constructTitle(connection, entityType),
            this.createNewTabParams(connection, catalogName, entityType, executeOnOpen),
            initialData ? initialData : new EntityViewerTabData()
        )
    }

    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): EntityViewerTabDefinition {
        const params: EntityViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        const data: EntityViewerTabData = this.restoreTabDataFromSerializable(dataJson)

        return new EntityViewerTabDefinition(
            this.constructTitle(
                params.dataPointer.connection,
                params.dataPointer.entityType
            ),
            params,
            data
        )
    }

    private constructTitle(connection: Connection, entityType: string): string {
        return `${entityType} [${connection.name}]`
    }

    private createNewTabParams(connection: Connection, catalogName: string, entityType: string, executeOnOpen: boolean): EntityViewerTabParams {
        return new EntityViewerTabParams(
            new EntityViewerDataPointer(
                connection,
                catalogName,
                entityType
            ),
            executeOnOpen
        )
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): EntityViewerTabParams {
        const dto: EntityViewerTabParamsDto = json as EntityViewerTabParamsDto
        return new EntityViewerTabParams(
            new EntityViewerDataPointer(
                this.connectionService.getConnection(dto.connectionId),
                dto.catalogName,
                dto.entityType
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    private restoreTabDataFromSerializable(json?: TabDataDto): EntityViewerTabData {
        if (json == undefined) {
            return new EntityViewerTabData()
        }
        const dto: EntityViewerTabDataDto = json as EntityViewerTabDataDto
        return new EntityViewerTabData(
            dto.queryLanguage,
            dto.filterBy,
            dto.orderBy,
            dto.dataLocale,
            dto.displayedProperties?.map((key: string) => EntityPropertyKey.fromString(key)),
            dto.pageSize,
            dto.pageNumber
        )
    }
}

export const useEntityViewerTabFactory = (): EntityViewerTabFactory => {
    return mandatoryInject(entityViewerTabFactoryInjectionKey) as EntityViewerTabFactory
}
