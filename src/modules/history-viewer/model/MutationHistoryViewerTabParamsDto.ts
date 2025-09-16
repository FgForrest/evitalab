import type { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

export interface MutationHistoryViewerTabParamsDto extends TabParamsDtoWithConnection {

    readonly catalogName: string

}
