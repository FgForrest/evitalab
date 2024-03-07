import { EvitaDBConnection } from '@/model/lab'
import LabEditorGraphQLConsole from '@/components/lab/editor/graphql-console/LabEditorGraphQLConsole.vue'
import { DefineComponent, markRaw } from 'vue'
import { LabService } from '@/services/lab.service'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { GraphQLConsoleParams } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleParams'
import { GraphQLConsoleData } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleData'
import { GraphQLInstanceType } from '@/model/editor/tab/graphQLConsole/GraphQLInstanceType'
import { GraphQLInstancePointer } from '@/model/editor/tab/graphQLConsole/GraphQLInstancePointer'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'
import { TabRequestComponentDataDto } from '@/model/editor/tab/TabRequestComponentDataDto'

/**
 * Creates new GraphQL tab.
 */
export class GraphQLConsoleRequest extends TabRequest<GraphQLConsoleParams, GraphQLConsoleData> {

    private constructor(title: string, params: GraphQLConsoleParams, initialData: GraphQLConsoleData) {
        super(
            undefined,
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
            initialData ? initialData : new GraphQLConsoleData()
        )
    }

    static restoreFromJson(labService: LabService, paramsJson: TabRequestComponentParamsDto, dataJson?: TabRequestComponentDataDto): GraphQLConsoleRequest {
        const params: GraphQLConsoleParams = GraphQLConsoleParams.restoreFromSerializable(labService, paramsJson)
        const data: GraphQLConsoleData = dataJson == undefined ? new GraphQLConsoleData() : GraphQLConsoleData.restoreFromSerializable(dataJson)

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

