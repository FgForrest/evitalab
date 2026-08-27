
import { KeymapViewerTabDefinition } from '@/modules/keymap/viewer/workspace/model/KeymapViewerTabDefinition'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'

export const keymapViewerTabFactoryInjectionKey: InjectionKey<KeymapViewerTabFactory> = Symbol('keymapViewerTabFactory')

export class KeymapViewerTabFactory implements TabFactory {

    readonly tabType: TabType = TabType.KeymapViewer
    readonly restorable: boolean = true

    createNew(): KeymapViewerTabDefinition {
        return new KeymapViewerTabDefinition();
    }

    /**
     * The keymap viewer tab cannot be parametrized, therefore there is nothing to restore from.
     */
    restoreFromJson(): KeymapViewerTabDefinition {
        return this.createNew()
    }
}

export const useKeymapViewerTabFactory = (): KeymapViewerTabFactory => {
    return mandatoryInject(keymapViewerTabFactoryInjectionKey) as KeymapViewerTabFactory
}
