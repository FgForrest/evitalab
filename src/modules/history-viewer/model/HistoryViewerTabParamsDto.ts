import type { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

export interface HistoryViewerTabParamsDto extends TabParamsDtoWithConnection {

    readonly catalogName: string

}
