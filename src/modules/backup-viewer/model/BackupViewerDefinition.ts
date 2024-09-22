import { TabDefinition } from "@/modules/workspace/tab/model/TabDefinition";
import { VoidTabData } from "@/modules/workspace/tab/model/void/VoidTabData";
import { DefineComponent, markRaw } from "vue";
import { BackupViewerTabParams } from '@/modules/backup-viewer/model/BackupViewerTabParams'
import BackupViewer from '@/modules/backup-viewer/components/BackupViewer.vue'

export class BackupViewerDefinition extends TabDefinition<BackupViewerTabParams, VoidTabData> {
    constructor(title: string, params: BackupViewerTabParams) {
        super(undefined,
            title,
            'mdi-cloud-download-outline',
            markRaw(BackupViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }
}
