import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { Keymap, keymapInjectionKey } from '@/modules/keymap/service/Keymap'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

export class KeymapModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
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
