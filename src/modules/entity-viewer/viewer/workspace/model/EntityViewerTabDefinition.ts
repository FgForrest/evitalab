import type {  } from 'vue'
import { markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { EntityViewerTabParams } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabParams'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import EntityViewer from '@/modules/entity-viewer/viewer/component/EntityViewer.vue'

/**
 * Creates new data grid tab.
 */
export class EntityViewerTabDefinition extends TabDefinition<EntityViewerTabParams, EntityViewerTabData> {

    constructor(title: string, params: EntityViewerTabParams, initialData: EntityViewerTabData) {
        super(
            undefined,
            title,
            EntityViewerTabDefinition.icon(),
            markRaw(EntityViewer as Component),
            params,
            initialData
        )
    }

    get tabType(): TabType {
        return TabType.EntityViewer
    }

    static icon(): string {
        return 'mdi-table'
    }
}
