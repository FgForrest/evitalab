import { TabRequest, TabRequestComponentDataDto, TabRequestComponentParamsDto } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'
import LabEditorGraphQLConsole from '@/components/lab/editor/graphql-console/LabEditorGraphQLConsole.vue'
import {
    GraphQLConsoleData,
    GraphQLConsoleParams,
    GraphQLInstancePointer,
    GraphQLInstanceType
} from '@/model/editor/graphql-console'
import { DefineComponent, markRaw } from 'vue'
import { LabService } from '@/services/lab.service'

/**
 * Creates new GraphQL tab.
 */
export class GraphQLConsoleRequest extends TabRequest<GraphQLConsoleParams, GraphQLConsoleData> {

    private constructor(title: string, params: GraphQLConsoleParams, initialData: GraphQLConsoleData | undefined = undefined) {
        super(
            title,
            'mdi-graphql',
            markRaw(LabEditorGraphQLConsole as DefineComponent<any, any, any>),
            params,
            initialData
        )
    }

    static createNew(connection: EvitaDBConnection,
                     catalogName: string,
                     instanceType: GraphQLInstanceType,
                     initialData: GraphQLConsoleData | undefined = undefined,
                     executeOnOpen: boolean = false): GraphQLConsoleRequest {
        return new GraphQLConsoleRequest(
            this.constructTitle(connection, catalogName, instanceType),
            new GraphQLConsoleParams(
                new GraphQLInstancePointer(connection, catalogName, instanceType),
                executeOnOpen
            ),
            initialData
        )
    }

    static restoreFromJson(labService: LabService, paramsJson: TabRequestComponentParamsDto, dataJson: TabRequestComponentDataDto): GraphQLConsoleRequest {
        const params: GraphQLConsoleParams = GraphQLConsoleParams.restoreFromSerializable(labService, paramsJson)
        const data: GraphQLConsoleData = GraphQLConsoleData.restoreFromSerializable(dataJson)

        return new GraphQLConsoleRequest(
            this.constructTitle(params.instancePointer.connection, params.instancePointer.catalogName, params.instancePointer.instanceType),
            params,
            data
        )
    }

    private static constructTitle(connection: EvitaDBConnection, catalogName: string, instanceType: GraphQLInstanceType): string {
        return (instanceType === GraphQLInstanceType.System ? instanceType : `${catalogName} - ${instanceType}`) +  ` [${connection.name}]`
    }
}

