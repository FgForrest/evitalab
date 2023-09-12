import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import LabEditorConsoleGraphQL from '@/components/lab/editor/console/LabEditorConsoleGraphQL.vue'
import { GraphQLConsoleProps, GraphQLInstancePointer, GraphQLInstanceType } from '@/model/editor/graphql-console'
import { DefineComponent, markRaw } from 'vue'

/**
 * Creates new GraphQL tab.
 */
export class GraphQLConsoleRequest extends TabRequest<GraphQLConsoleProps> {
    constructor(connection: EvitaDBConnection, catalogName: string, instanceType: GraphQLInstanceType) {
        super(
            (instanceType === GraphQLInstanceType.SYSTEM ? instanceType : `${catalogName} - ${instanceType}`) +  ` [${connection.name}]`,
            'mdi-graphql',
            markRaw(LabEditorConsoleGraphQL as DefineComponent<any, any, any>),
            {
                instancePointer: new GraphQLInstancePointer(connection, catalogName, instanceType)
            }
        )
    }
}

