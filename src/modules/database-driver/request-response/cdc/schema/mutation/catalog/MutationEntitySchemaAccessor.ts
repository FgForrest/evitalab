import Immutable, { Map as ImmutableMap, Set as ImmutableSet } from 'immutable'
import type {
    EntitySchemaProvider
} from '@/modules/database-driver/request-response/cdc/schema/EntitySchemaProvider.ts'
import type {
    EntitySchemaContract
} from '@/modules/database-driver/request-response/cdc/schema/EntitySchemaContract.ts'

export class MutationEntitySchemaAccessor implements EntitySchemaProvider {
    readonly baseAccessor: EntitySchemaProvider
    readonly entitySchemas: ImmutableMap<string, EntitySchemaContract>
    readonly removedEntitySchemas: ImmutableSet<string>


    constructor(baseAccessor: EntitySchemaProvider, entitySchemas: Immutable.Map<string, EntitySchemaContract>, removedEntitySchemas: Immutable.Set<string>) {
        this.baseAccessor = baseAccessor
        this.entitySchemas = entitySchemas
        this.removedEntitySchemas = removedEntitySchemas
    }
}
