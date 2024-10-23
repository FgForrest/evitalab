import { Connection } from "@/modules/connection/model/Connection";
import { ConnectionService } from "@/modules/connection/service/ConnectionService";
import { mandatoryInject } from "@/utils/reactivity";
import { InjectionKey } from "vue";
import { BackupViewerTabDefinition } from "../model/BackupViewerTabDefinition";
import { TabParamsDto } from "@/modules/workspace/tab/model/TabParamsDto";
import { BackupViewerTabParamsDto } from "../model/BackupViewerTabParamsDto";
import { BackupViewerTabParams } from '@/modules/backup-viewer/model/BackupViewerTabParams'

export const backupsTabFactoryInjectionKey: InjectionKey<BackupViewerTabFactory> = Symbol('BackupsTabFactory')

export class BackupViewerTabFactory {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService){
        this.connectionService = connectionService
    }

    createNew(connection: Connection): BackupViewerTabDefinition {
        return new BackupViewerTabDefinition(
            this.constructTitle(connection),
            new BackupViewerTabParams(connection)
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): BackupViewerTabDefinition {
        const params: BackupViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        return new BackupViewerTabDefinition(
            this.constructTitle(params.connection),
            params
        )
    }

    // todo lho i18n
    private constructTitle(connection: Connection): string {
        return `Catalog backups [${connection.name}]`
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): BackupViewerTabParams {
        const dto: BackupViewerTabParamsDto = json as BackupViewerTabParamsDto
        return new BackupViewerTabParams(
            this.connectionService.getConnection(dto.connectionId)
        )
    }
}

export const useBackupsTabFactory = (): BackupViewerTabFactory => {
    return mandatoryInject(backupsTabFactoryInjectionKey) as BackupViewerTabFactory
}
