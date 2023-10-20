import { App } from 'vue'
import { Store } from 'vuex'
import { State } from '@/store'
import { LabService, key as labServiceKey } from '@/services/lab.service'
import { EditorService, key as editorServiceKey } from '@/services/editor/editor.service'
import { DemoSnippetResolver, key as demoSnippetResolverKey } from '@/services/editor/demo-snippet-resolver.service'
import { GraphQLConsoleService, key as graphQLConsoleServiceKey } from '@/services/editor/graphql-console.service'
import { DataGridConsoleService, key as dataGridServiceKey } from '@/services/editor/data-grid-console.service'
import { EvitaQLConsoleService, key as evitaQLConsoleServiceKey } from '@/services/editor/evitaql-console.service'
import { SchemaViewerService, key as schemaViewerServiceKey } from '@/services/editor/schema-viewer.service'
import { EvitaDBClient } from '@/services/evitadb-client'
import { GraphQLClient } from '@/services/graphql-client'
import { EvitaDBDocsClient } from '@/services/evitadb-docs-client'

/**
 * Creates and registers all lab services to the application.
 */
export function registerServices(app: App, store: Store<State>): void {
    const evitaDBClient: EvitaDBClient = new EvitaDBClient()
    const graphQLClient: GraphQLClient = new GraphQLClient()
    const evitaDBDocsClient: EvitaDBDocsClient = new EvitaDBDocsClient()

    const labService: LabService = new LabService(store, evitaDBClient, evitaDBDocsClient)
    const editorService: EditorService = new EditorService(store)
    const demoSnippetResolver: DemoSnippetResolver = new DemoSnippetResolver(labService)
    const dataGridConsoleService: DataGridConsoleService = new DataGridConsoleService(labService, evitaDBClient, graphQLClient)
    const graphQLConsoleService: GraphQLConsoleService = new GraphQLConsoleService(labService, graphQLClient)
    const evitaQLConsoleService: EvitaQLConsoleService = new EvitaQLConsoleService(labService, evitaDBClient)
    const schemaViewerService: SchemaViewerService = new SchemaViewerService(labService)

    app
        .provide(labServiceKey, labService)
        .provide(editorServiceKey, editorService)
        .provide(demoSnippetResolverKey, demoSnippetResolver)
        .provide(dataGridServiceKey, dataGridConsoleService)
        .provide(graphQLConsoleServiceKey, graphQLConsoleService)
        .provide(evitaQLConsoleServiceKey, evitaQLConsoleService)
        .provide(schemaViewerServiceKey, schemaViewerService)
}
