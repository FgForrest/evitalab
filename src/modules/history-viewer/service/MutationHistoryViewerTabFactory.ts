import type { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { mandatoryInject } from '@/utils/reactivity'
import { i18n } from '@/vue-plugins/i18n'
import {
    MutationHistoryViewerTabDefinition
} from '@/modules/history-viewer/model/MutationHistoryViewerTabDefinition.ts'
import { MutationHistoryViewerTabParams } from '@/modules/history-viewer/model/MutationHistoryViewerTabParams.ts'
import type {
    MutationHistoryViewerTabParamsDto
} from '@/modules/history-viewer/model/MutationHistoryViewerTabParamsDto.ts'
import { MutationHistoryDataPointer } from '@/modules/history-viewer/model/MutationHistoryDataPointer.ts'
import { MutationHistoryViewerTabData } from '@/modules/history-viewer/model/MutationHistoryViewerTabData.ts'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto.ts'
import { OffsetDateTime, Timestamp } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import type { MutationHistoryViewerTabDataDto } from '@/modules/history-viewer/model/MutationHistoryViewerTabDataDto.ts'

export const mutationHistoryViewerTabFactoryInjectionKey: InjectionKey<MutationHistoryViewerTabFactory> = Symbol('mutationHistoryViewerTabFactory')

export class MutationHistoryViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }


    createNew(catalogName: string, initialData: MutationHistoryViewerTabData | undefined = undefined): MutationHistoryViewerTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new MutationHistoryViewerTabDefinition(
            this.constructTitle(),
            new MutationHistoryViewerTabParams(
                new MutationHistoryDataPointer(
                    connection,
                    catalogName
                )
            ),
            initialData != undefined ? initialData : new MutationHistoryViewerTabData()
        )
    }

    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): MutationHistoryViewerTabDefinition {
        const params: MutationHistoryViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        const data: MutationHistoryViewerTabData = this.restoreTabDataFromSerializable(dataJson)


        return new MutationHistoryViewerTabDefinition(
            this.constructTitle(),
            params,
            data
        )
    }

    private constructTitle(): string {
        return i18n.global.t('mutationHistoryViewer.definition.title')
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): MutationHistoryViewerTabParams {
        const dto: MutationHistoryViewerTabParamsDto = json as MutationHistoryViewerTabParamsDto
        return new MutationHistoryViewerTabParams(
            new MutationHistoryDataPointer(
                this.connectionService.getConnection(dto.connectionId),
                dto.catalogName
            )
        )
    }

    private restoreTabDataFromSerializable(json?: TabDataDto): MutationHistoryViewerTabData {
        if (json == undefined) {
            return new MutationHistoryViewerTabData()
        }
        const dto: MutationHistoryViewerTabDataDto = json as MutationHistoryViewerTabDataDto
        return new MutationHistoryViewerTabData(
            dto.from != undefined
                ? new OffsetDateTime(
                    new Timestamp(BigInt(dto.from.seconds), dto.from.nanos),
                    dto.from.offset
                )
                : undefined,
            dto.to != undefined
                ? new OffsetDateTime(
                    new Timestamp(BigInt(dto.to.seconds), dto.to.nanos),
                    dto.to.offset
                )
                : undefined,
            dto.entityPrimaryKey,
            dto.operationList,
            dto.containerNameList,
            dto.containerTypeList,
            dto.entityType,
            dto.areaType,
            dto.mutableFilters
        )

    }
}

export const useHistoryViewerTabFactory = (): MutationHistoryViewerTabFactory => {
    return mandatoryInject(mutationHistoryViewerTabFactoryInjectionKey)
}
