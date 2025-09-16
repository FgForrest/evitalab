import type { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { mandatoryInject } from '@/utils/reactivity'
import { i18n } from '@/vue-plugins/i18n'
import  { HistoryViewerTabDefinition } from '@/modules/history-viewer/model/HistoryViewerTabDefinition.ts'
import { HistoryViewerTabParams } from '@/modules/history-viewer/model/HistoryViewerTabParams.ts'
import type { HistoryViewerTabParamsDto } from '@/modules/history-viewer/model/HistoryViewerTabParamsDto.ts'

export const mutationHistoryViewerTabFactoryInjectionKey: InjectionKey<MutationHistoryViewerTabFactory> = Symbol('mutationHistoryViewerTabFactory')

export class MutationHistoryViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(catalogName: string): HistoryViewerTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new HistoryViewerTabDefinition(
            this.constructTitle(),
            new HistoryViewerTabParams(connection, catalogName)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): HistoryViewerTabDefinition {
        const params: HistoryViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new HistoryViewerTabDefinition(
            this.constructTitle(),
            params
        )
    }

    private constructTitle(): string {
        return i18n.global.t('historyViewer.definition.title')
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): HistoryViewerTabParams {
        const dto: HistoryViewerTabParamsDto = json as HistoryViewerTabParamsDto
        return new HistoryViewerTabParams(
            this.connectionService.getConnection(dto.connectionId),
            dto.catalogName
        )
    }
}

export const useHistoryViewerTabFactory = ():MutationHistoryViewerTabFactory => {
    return mandatoryInject(mutationHistoryViewerTabFactoryInjectionKey) as MutationHistoryViewerTabFactory
}
