import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { GlobalAttributeSchema } from '@/modules/connection/model/schema/GlobalAttributeSchema'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { Value } from '@/modules/connection/model/Value'
import { AbstractSchema } from '@/modules/connection/model/schema/AbstractSchema'

/**
 * evitaLab's representation of a single evitaDB catalog schema independent of specific evitaDB version
 */
export class CatalogSchema extends AbstractSchema {
    readonly version: Value<number>
    /**
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    readonly nameVariants: Value<Map<NamingConvention, string>>
    readonly description: Value<string | null>

    readonly attributes: Value<Map<string, GlobalAttributeSchema>>
    private _entitySchemas: Value<Map<string, EntitySchema>> | undefined
    private readonly entitySchemaAccessor: (catalogName: string) => Promise<Value<List<EntitySchema>>>

    async entitySchemas(): Promise<Value<Map<string, EntitySchema>>> {
        if (this._entitySchemas == undefined) {
            const list: Value<List<EntitySchema>> = await this.entitySchemaAccessor(this.name)
            this._entitySchemas = list.map(it =>
                Map(it.map(entitySchema => [entitySchema.name, entitySchema])))

        }
        return this._entitySchemas
    }

    private readonly _representativeFlags: List<string> = List()

    constructor(
        version: Value<number>,
        name: string,
        nameVariants: Value<Map<NamingConvention, string>>,
        description: Value<string | null>,
        attributes: Value<GlobalAttributeSchema[]>,
        entitySchemaAccessor: (catalogName: string) => Promise<
            Value<List<EntitySchema>>
        >
    ) {
        super()
        this.version = version
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.attributes = attributes.map((it) =>
            Map(it.map((attribute) => [attribute.name, attribute]))
        )
        this.entitySchemaAccessor = entitySchemaAccessor
    }

    get representativeFlags(): List<string> {
        return this._representativeFlags
    }
}
