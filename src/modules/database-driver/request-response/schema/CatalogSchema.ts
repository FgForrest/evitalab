import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import { GlobalAttributeSchema } from '@/modules/database-driver/request-response/schema/GlobalAttributeSchema'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { EntitySchemaAccessor } from '@/modules/database-driver/request-response/schema/EntitySchemaAccessor'

/**
 * evitaLab's representation of a single evitaDB catalog schema independent of specific evitaDB version
 */
export class CatalogSchema extends AbstractSchema {
    readonly version: number
    /**
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    readonly nameVariants: Map<NamingConvention, string>
    readonly description: string | undefined

    readonly attributes: Map<string, GlobalAttributeSchema>
    private _entitySchemas: Map<string, EntitySchema> | undefined
    private readonly entitySchemaAccessor: EntitySchemaAccessor

    async entitySchemas(): Promise<Map<string, EntitySchema>> {
        if (this._entitySchemas == undefined) {
            const list: List<EntitySchema> = await this.entitySchemaAccessor.getEntitySchemas()
            this._entitySchemas = Map(list.map(entitySchema => [entitySchema.name, entitySchema]))

        }
        return this._entitySchemas
    }

    private readonly _representativeFlags: List<string> = List()

    constructor(
        version: number,
        name: string,
        nameVariants: Map<NamingConvention, string>,
        description: string | undefined,
        attributes: GlobalAttributeSchema[],
        entitySchemaAccessor: EntitySchemaAccessor
    ) {
        super()
        this.version = version
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.attributes = Map(attributes.map((attribute) => [attribute.name, attribute]))
        this.entitySchemaAccessor = entitySchemaAccessor
    }

    get representativeFlags(): List<string> {
        return this._representativeFlags
    }
}
