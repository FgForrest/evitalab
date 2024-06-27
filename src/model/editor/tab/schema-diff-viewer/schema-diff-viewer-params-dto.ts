import { TabRequestComponentParamsDto } from '@/model/editor/editor'
import { EvitaDBConnectionId } from '@/model/lab'

// todo docs
export interface SchemaDiffViewerParamsDto extends TabRequestComponentParamsDto {
    readonly connectionId: EvitaDBConnectionId
    readonly catalogName: string
}
