import { TabDefinition } from "@/modules/workspace/tab/model/TabDefinition";
import { VoidTabData } from "@/modules/workspace/tab/model/void/VoidTabData";
import type { Component } from "vue";
import { markRaw } from 'vue'
import { BackupViewerTabParams } from '@/modules/backup-viewer/model/BackupViewerTabParams'
import BackupViewer from '@/modules/backup-viewer/components/BackupViewer.vue'

export class BackupViewerTabDefinition extends TabDefinition<BackupViewerTabParams, VoidTabData> {

    constructor(title: string, params: BackupViewerTabParams) {
        super(
            undefined,
            title,
            BackupViewerTabDefinition.icon(),
            markRaw(BackupViewer as Component),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-cloud-download-outline'
    }
}
