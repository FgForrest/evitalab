import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import { List as ImmutableList } from 'immutable'
import type { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

// todo docs
export abstract class AbstractSchema implements Schema {

    abstract get representativeFlags(): ImmutableList<Flag>

    protected formatDataTypeForFlag(dataType: string): string {
        return dataType
            .replace('Array', '[]')
    }
}
