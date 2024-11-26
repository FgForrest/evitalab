import { DefineComponent, markRaw } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabParams } from '@/modules/workspace/tab/model/void/VoidTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import KeymapViewer from '@/modules/keymap/viewer/component/KeymapViewer.vue'

/**
 * Creates new keymap viewer tab if there is no one opened yet.
 */
export class KeymapViewerTabDefinition extends TabDefinition<VoidTabParams, VoidTabData> {

    constructor() {
        super(
            'keymap', // only one keymap viewer tab can be opened at a time, multiple doesn't make sense since it cannot be parametrized
            'Keymap',
            KeymapViewerTabDefinition.icon(),
            markRaw(KeymapViewer as DefineComponent<any, any, any>),
            new VoidTabParams(),
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-keyboard-outline'
    }
}
