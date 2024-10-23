import { ModuleRegistrar } from '@/ModuleRegistrar'
import { Keymap, keymapInjectionKey } from '@/modules/keymap/service/Keymap'
import {
    KeymapViewerTabFactory,
    keymapViewerTabFactoryInjectionKey
} from '@/modules/keymap/viewer/workspace/service/KeymapViewerTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo lho
export class KeymapModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        builder.provide(
            keymapInjectionKey,
            new Keymap()
        )
        // todo lho fix circular dep
        // builder.provide(
        //     keymapViewerTabFactoryInjectionKey,
        //     new KeymapViewerTabFactory()
        // )
    }
}
