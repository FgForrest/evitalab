// todo docs
import { KeymapViewerTabDefinition } from '@/modules/keymap/viewer/workspace/model/KeymapViewerTabDefinition'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const keymapViewerTabFactoryInjectionKey: InjectionKey<KeymapViewerTabFactory> = Symbol('keymapViewerTabFactory')

export class KeymapViewerTabFactory {

    createNew(): KeymapViewerTabDefinition {
        return new KeymapViewerTabDefinition();
    }
}

export const useKeymapViewerTabFactory = (): KeymapViewerTabFactory => {
    return mandatoryInject(keymapViewerTabFactoryInjectionKey) as KeymapViewerTabFactory
}
