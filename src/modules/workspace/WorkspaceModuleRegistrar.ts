import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { DemoSnippetResolver, demoSnippetResolverInjectionKey } from '@/modules/workspace/service/DemoSnippetResolver'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import { useWorkspaceStore } from '@/modules/workspace/store/workspaceStore'
import type { WorkspaceStore } from '@/modules/workspace/store/workspaceStore'
import { LabStorage, labStorageInjectionKey } from '@/modules/storage/LabStorage'
import { SharedTabResolver, sharedTabResolverInjectionKey } from '@/modules/workspace/tab/service/SharedTabResolver'
import {
    TabFactoryRegistry,
    tabFactoryRegistryInjectionKey
} from '@/modules/workspace/tab/service/TabFactoryRegistry'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'

export class WorkspaceModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const workspaceStore: WorkspaceStore = useWorkspaceStore()

        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)
        const labStorage: LabStorage = builder.inject(labStorageInjectionKey)

        // feature modules contribute their tab factories into this registry, which keeps the workspace
        // independent of them
        const tabFactoryRegistry: TabFactoryRegistry = new TabFactoryRegistry()
        builder.provide(tabFactoryRegistryInjectionKey, tabFactoryRegistry)

        builder.provide(
            workspaceServiceInjectionKey,
            new WorkspaceService(
                evitaLabConfig,
                workspaceStore,
                labStorage,
                tabFactoryRegistry
            )
        )
        builder.provide(
            demoSnippetResolverInjectionKey,
            new DemoSnippetResolver()
        )
        builder.provide(
            sharedTabResolverInjectionKey,
            new SharedTabResolver(tabFactoryRegistry)
        )
    }
}
