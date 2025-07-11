import { Connection } from "@/modules/connection/model/Connection";
import { ConnectionService } from "@/modules/connection/service/ConnectionService";
import { mandatoryInject } from "@/utils/reactivity";
import type { InjectionKey } from "vue";
import { BackupViewerTabDefinition } from "../model/BackupViewerTabDefinition";
import type { TabParamsDto } from "@/modules/workspace/tab/model/TabParamsDto";
import type { BackupViewerTabParamsDto } from "../model/BackupViewerTabParamsDto";
import { BackupViewerTabParams } from '@/modules/backup-viewer/model/BackupViewerTabParams'
import { i18n } from '@/vue-plugins/i18n'

export const backupViewerTabFactoryInjectionKey: InjectionKey<BackupViewerTabFactory> = Symbol('BackupsTabFactory')

export class BackupViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService){
        this.connectionService = connectionService
    }

    createNew(): BackupViewerTabDefinition {
        const connection: Connection = this.connectionService.getConnection()
        return new BackupViewerTabDefinition(
            this.constructTitle(),
            new BackupViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): BackupViewerTabDefinition {
        const params: BackupViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new BackupViewerTabDefinition(
            this.constructTitle(),
            params
        )
    }

    private constructTitle(): string {
        return i18n.global.t('backupViewer.definition.title')

    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): BackupViewerTabParams {
        const dto: BackupViewerTabParamsDto = json as BackupViewerTabParamsDto
        return new BackupViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export const useBackupsTabFactory = (): BackupViewerTabFactory => {
    return mandatoryInject(backupViewerTabFactoryInjectionKey) as BackupViewerTabFactory
}
