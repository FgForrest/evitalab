import { DefineComponent, markRaw } from 'vue'
import LabEditorKeymapViewer from '@/components/lab/editor/keymap-viewer/LabEditorKeymapViewer.vue'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { VoidTabRequestComponentParams } from '@/model/editor/tab/void/VoidTabRequestComponentParams'
import { VoidTabRequestComponentData } from '@/model/editor/tab/void/VoidTabRequestComponentData'

/**
 * Creates new keymap viewer tab if there is no one opened yet.
 */
export class KeymapViewerRequest extends TabRequest<VoidTabRequestComponentParams, VoidTabRequestComponentData> {

    private constructor() {
        super(
            'keymap', // only one keymap viewer tab can be opened at a time, multiple doesn't make sense since it cannot be parametrized
            'Keymap',
            'mdi-keyboard-outline',
            markRaw(LabEditorKeymapViewer as DefineComponent<any, any, any>),
            new VoidTabRequestComponentParams(),
            new VoidTabRequestComponentData()
        )
    }

    static createNew(): KeymapViewerRequest {
        return new KeymapViewerRequest()
    }
}
