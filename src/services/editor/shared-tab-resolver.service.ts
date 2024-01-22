import { TabRequest } from '@/model/editor/editor'
import { UnexpectedError } from '@/model/lab'
import { GraphQLConsoleRequest } from '@/model/editor/graphql-console-request'
import { LabService } from '@/services/lab.service'
import { inject, InjectionKey } from 'vue'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { EvitaQLConsoleRequest } from '@/model/editor/evitaql-console-request'
import { DataGridRequest } from '@/model/editor/data-grid-request'
import { ShareTabObject } from '@/model/editor/tab/share-tab-object'

import { TabType } from '@/model/editor/tab/tab-type'

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
