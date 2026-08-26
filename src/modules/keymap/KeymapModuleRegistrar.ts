import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { Keymap, keymapInjectionKey } from '@/modules/keymap/service/Keymap'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import {
    KeymapViewerTabFactory,
    keymapViewerTabFactoryInjectionKey
} from '@/modules/keymap/viewer/workspace/service/KeymapViewerTabFactory'

export class KeymapModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

        const keymapViewerTabFactory: KeymapViewerTabFactory = new KeymapViewerTabFactory()
        builder.provide(keymapViewerTabFactoryInjectionKey, keymapViewerTabFactory)
        tabFactoryRegistry.register(keymapViewerTabFactory)

        builder.provide(
            keymapInjectionKey,
            new Keymap()
        )
    }
}
