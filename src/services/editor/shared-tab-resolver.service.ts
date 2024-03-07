import { UnexpectedError } from '@/model/lab'
import { LabService } from '@/services/lab.service'
import { inject, InjectionKey } from 'vue'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { ShareTabObject } from '@/model/editor/tab/ShareTabObject'
import { TabType } from '@/model/editor/tab/TabType'
import { DataGridRequest } from '@/model/editor/tab/dataGrid/data-grid-request'
import { EvitaQLConsoleRequest } from '@/model/editor/tab/evitaQLConsole/EvitaQLConsoleRequest'
import { GraphQLConsoleRequest } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleRequest'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'

export const key: InjectionKey<SharedTabResolver> = Symbol()

/**
 * Resolves shared tab requests from URL into {@link TabRequest}s.
 */
export class SharedTabResolver {
    private readonly labService: LabService

    constructor(labService: LabService) {
        this.labService = labService
    }

    async resolve(shareTabObjectSerialized: string | undefined): Promise<TabRequest<any, any> | undefined> {
        if (shareTabObjectSerialized == undefined) {
            return undefined
        }
        const shareTabObject: ShareTabObject = ShareTabObject.fromLinkParam(shareTabObjectSerialized)

        switch (shareTabObject.tabType) {
            case TabType.DataGrid:
                return DataGridRequest.restoreFromJson(this.labService, shareTabObject.tabParams, shareTabObject.tabData)
            case TabType.EvitaQLConsole:
                return EvitaQLConsoleRequest.restoreFromJson(this.labService, shareTabObject.tabParams, shareTabObject.tabData)
            case TabType.GraphQLConsole:
                return GraphQLConsoleRequest.restoreFromJson(this.labService, shareTabObject.tabParams, shareTabObject.tabData)
            case TabType.SchemaViewer:
                return SchemaViewerRequest.restoreFromJson(this.labService, shareTabObject.tabParams)
            default:
                throw new UnexpectedError(undefined, `Unsupported shared tab type '${shareTabObject.tabType}'.`)
        }
    }
}

export const useSharedTabResolver = (): SharedTabResolver => {
    return inject(key) as SharedTabResolver
}
