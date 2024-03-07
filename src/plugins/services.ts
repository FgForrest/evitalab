import { App } from 'vue'
import { Store } from 'vuex'
import { State } from '@/store'
import { LabService, key as labServiceKey } from '@/services/lab.service'
import { EditorService, key as editorServiceKey } from '@/services/editor/editor.service'
import { DemoSnippetResolver, key as demoSnippetResolverKey } from '@/services/editor/demo-snippet-resolver.service'
import { SharedTabResolver, key as sharedTabResolverKey } from '@/services/editor/shared-tab-resolver.service'
import { GraphQLConsoleService, key as graphQLConsoleServiceKey } from '@/services/editor/graphql-console.service'
import { DataGridService, key as dataGridServiceKey } from '@/services/editor/data-grid.service'
import { EvitaQLConsoleService, key as evitaQLConsoleServiceKey } from '@/services/editor/evitaql-console.service'
import { SchemaViewerService, key as schemaViewerServiceKey } from '@/services/editor/schema-viewer.service'
import { EvitaDBClient } from '@/services/evitadb-client'
import { GraphQLClient } from '@/services/graphql-client'
import { EvitaDBDocsClient } from '@/services/evitadb-docs-client'
import { GraphQLResultVisualiserService, key as graphqlResultVisualiserServiceKey } from '@/services/editor/result-visualiser/graphql-result-visualiser.service'
import { EvitaQLResultVisualiserService, key as evitaQLResultVisualiserServiceKey } from '@/services/editor/result-visualiser/evitaql-result-visualiser.service'
import { Keymap, key as keymapKey } from '@/model/editor/keymap/Keymap'

/**
 * Creates and registers all lab services to the application.
 */
export function registerServices(app: App, store: Store<State>): void {
    const keymap: Keymap = new Keymap()

    const evitaDBClient: EvitaDBClient = new EvitaDBClient()
    const graphQLClient: GraphQLClient = new GraphQLClient()
    const evitaDBDocsClient: EvitaDBDocsClient = new EvitaDBDocsClient()

    const labService: LabService = new LabService(store, evitaDBClient, evitaDBDocsClient)
    const editorService: EditorService = new EditorService(store, labService)
    const demoSnippetResolver: DemoSnippetResolver = new DemoSnippetResolver(labService)
    const sharedTabResolver: SharedTabResolver = new SharedTabResolver(labService)
    const dataGridService: DataGridService = new DataGridService(labService, evitaDBClient, graphQLClient)
    const graphQLConsoleService: GraphQLConsoleService = new GraphQLConsoleService(graphQLClient)
    const evitaQLConsoleService: EvitaQLConsoleService = new EvitaQLConsoleService(evitaDBClient)
    const schemaViewerService: SchemaViewerService = new SchemaViewerService(labService)

    const graphQLResultVisualizerService: GraphQLResultVisualiserService = new GraphQLResultVisualiserService(labService)
    const evitaQLResultVisualizerService: EvitaQLResultVisualiserService = new EvitaQLResultVisualiserService(labService)

    app
        .provide(keymapKey, keymap)
        .provide(labServiceKey, labService)
        .provide(editorServiceKey, editorService)
        .provide(demoSnippetResolverKey, demoSnippetResolver)
        .provide(sharedTabResolverKey, sharedTabResolver)
        .provide(dataGridServiceKey, dataGridService)
        .provide(graphQLConsoleServiceKey, graphQLConsoleService)
        .provide(evitaQLConsoleServiceKey, evitaQLConsoleService)
        .provide(schemaViewerServiceKey, schemaViewerService)
        .provide(graphqlResultVisualiserServiceKey, graphQLResultVisualizerService)
        .provide(evitaQLResultVisualiserServiceKey, evitaQLResultVisualizerService)
}
