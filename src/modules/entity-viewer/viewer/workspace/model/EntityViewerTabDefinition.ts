import { DefineComponent, markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
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
            'mdi-table',
            markRaw(EntityViewer as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }
}
