import { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

export interface TrafficRecordHistoryViewerTabParamsDto extends TabParamsDtoWithConnection {
    readonly catalogName: string
}
