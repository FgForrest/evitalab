import type { InjectionKey } from 'vue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { mandatoryInject } from '@/utils/reactivity'
import { i18n } from '@/vue-plugins/i18n'
import  { MutationHistoryViewerTabDefinition } from '@/modules/history-viewer/model/MutationHistoryViewerTabDefinition.ts'
import { MutationHistoryViewerTabParams } from '@/modules/history-viewer/model/MutationHistoryViewerTabParams.ts'
import type { MutationHistoryViewerTabParamsDto } from '@/modules/history-viewer/model/MutationHistoryViewerTabParamsDto.ts'

export const mutationHistoryViewerTabFactoryInjectionKey: InjectionKey<MutationHistoryViewerTabFactory> = Symbol('mutationHistoryViewerTabFactory')

export class MutationHistoryViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(catalogName: string): MutationHistoryViewerTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new MutationHistoryViewerTabDefinition(
            this.constructTitle(),
            new MutationHistoryViewerTabParams(connection, catalogName)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): MutationHistoryViewerTabDefinition {
        const params: MutationHistoryViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new MutationHistoryViewerTabDefinition(
            this.constructTitle(),
            params
        )
    }

    private constructTitle(): string {
        return i18n.global.t('historyViewer.definition.title')
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): MutationHistoryViewerTabParams {
        const dto: MutationHistoryViewerTabParamsDto = json as MutationHistoryViewerTabParamsDto
        return new MutationHistoryViewerTabParams(
            this.connectionService.getConnection(dto.connectionId),
            dto.catalogName
        )
    }
}

export const useHistoryViewerTabFactory = ():MutationHistoryViewerTabFactory => {
    return mandatoryInject(mutationHistoryViewerTabFactoryInjectionKey) as MutationHistoryViewerTabFactory
}
