import { TabRequest } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import LabEditorConsoleGraphQL from '@/components/lab/editor/console/LabEditorConsoleGraphQL.vue'
import {
    GraphQLConsoleData,
    GraphQLConsoleParams,
    GraphQLInstancePointer,
    GraphQLInstanceType
} from '@/model/editor/graphql-console'
import { DefineComponent, markRaw } from 'vue'

/**
 * Creates new GraphQL tab.
 */
export class GraphQLConsoleRequest extends TabRequest<GraphQLConsoleParams, GraphQLConsoleData> {

    constructor(connection: EvitaDBConnection,
                catalogName: string,
                instanceType: GraphQLInstanceType,
                initialData: GraphQLConsoleData | undefined = undefined,
                executeOnOpen: boolean = false) {
        super(
            (instanceType === GraphQLInstanceType.SYSTEM ? instanceType : `${catalogName} - ${instanceType}`) +  ` [${connection.name}]`,
            'mdi-graphql',
            markRaw(LabEditorConsoleGraphQL as DefineComponent<any, any, any>),
            {
                instancePointer: new GraphQLInstancePointer(connection, catalogName, instanceType),
                executeOnOpen
            },
            initialData
        )
    }
}

