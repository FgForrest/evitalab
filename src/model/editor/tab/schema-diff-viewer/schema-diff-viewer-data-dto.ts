import { TabRequestComponentDataDto } from '@/model/editor/editor'
import { EvitaDBConnectionId } from '@/model/lab'
import { SchemaType } from '@/model/editor/tab/schema-diff-viewer/schema-type'

// todo lho
export interface SchemaDiffViewerDataDto extends TabRequestComponentDataDto {
    readonly compareWithConnectionId?: EvitaDBConnectionId
    readonly compareWithCatalogName?: string
    readonly schemaType?: SchemaType
}
