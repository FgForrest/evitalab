import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import { List as ImmutableList } from 'immutable'

// todo docs
export abstract class AbstractSchema implements Schema {

    abstract get representativeFlags(): ImmutableList<string>

    protected formatDataTypeForFlag(dataType: string): string {
        return dataType
            .replace('Array', '[]')
    }
}
