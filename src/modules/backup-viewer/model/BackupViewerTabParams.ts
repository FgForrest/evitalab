import { TabParams } from "@/modules/workspace/tab/model/TabParams";
import { BackupViewerTabParamsDto } from "./BackupViewerTabParamsDto";
import { Connection } from "@/modules/connection/model/Connection";

export class BackupViewerTabParams implements TabParams<BackupViewerTabParamsDto> {

    readonly connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    toSerializable(): BackupViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
            connectionName: this.connection.name
        }
    }
}
