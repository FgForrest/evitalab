import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import { type Toaster, toasterInjectionKey } from '@/modules/notification/service/Toaster'
import {
    CatalogViewerTabFactory,
    catalogViewerTabFactoryInjectionKey
} from '@/modules/catalog-viewer/service/CatalogViewerTabFactory'
import {
    SchemaViewerTabFactory,
    schemaViewerTabFactoryInjectionKey
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import {
    EvitaQLConsoleTabFactory,
    evitaQLConsoleTabFactoryInjectionKey
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import {
    GraphQLConsoleTabFactory,
    graphQLConsoleTabFactoryInjectionKey
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import {
    EntityViewerTabFactory,
    entityViewerTabFactoryInjectionKey
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { SymbolActionExecutor } from '@/modules/symbol-search/service/SymbolActionExecutor'
import {
    SymbolSearchService,
    symbolSearchServiceInjectionKey
} from '@/modules/symbol-search/service/SymbolSearchService'

/**
 * Registers the application-wide symbol search. Must come after every module whose tab factory it opens tabs with.
 */
export class SymbolSearchModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const toaster: Toaster = builder.inject(toasterInjectionKey)
        const catalogViewerTabFactory: CatalogViewerTabFactory = builder.inject(catalogViewerTabFactoryInjectionKey)
        const schemaViewerTabFactory: SchemaViewerTabFactory = builder.inject(schemaViewerTabFactoryInjectionKey)
        const evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory = builder.inject(evitaQLConsoleTabFactoryInjectionKey)
        const graphQLConsoleTabFactory: GraphQLConsoleTabFactory = builder.inject(graphQLConsoleTabFactoryInjectionKey)
        const entityViewerTabFactory: EntityViewerTabFactory = builder.inject(entityViewerTabFactoryInjectionKey)

        const symbolActionExecutor: SymbolActionExecutor = new SymbolActionExecutor(
            workspaceService,
            catalogViewerTabFactory,
            schemaViewerTabFactory,
            evitaQLConsoleTabFactory,
            graphQLConsoleTabFactory,
            entityViewerTabFactory
        )
        builder.provide(
            symbolSearchServiceInjectionKey,
            new SymbolSearchService(evitaClient, symbolActionExecutor, toaster)
        )
    }
}
