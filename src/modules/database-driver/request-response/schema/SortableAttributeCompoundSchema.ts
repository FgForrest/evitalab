import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import { OrderBehaviour } from '@/modules/database-driver/request-response/schema/OrderBehaviour'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'

/**
 * evitaLab's representation of a single evitaDB sortable attribute compound schema schema independent of specific evitaDB version
 */
export class SortableAttributeCompoundSchema extends AbstractSchema {

    /**
     * Contains unique name of the model. Case-sensitive. Distinguishes one model item from another within single entity instance.
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    readonly nameVariants: Map<NamingConvention, string>
    /**
     * Contains description of the model is optional but helps authors of the schema / client API to better explain the original purpose of the model to the consumers.
     */
    readonly description: string | undefined
    /**
     * Deprecation notice contains information about planned removal of this entity from the model / client API. This allows to plan and evolve the schema allowing clients to adapt early to planned breaking changes.  If notice is `null`, this schema is considered not deprecated.
     */
    readonly deprecationNotice: string | undefined
    /**
     * Collection of attribute elements that define the sortable compound. The order of the elements is important, as it defines the order of the sorting.
     */
    readonly attributeElements: List<AttributeElement>

    private readonly _representativeFlags: List<string> = List()

    constructor(name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                attributeElements: AttributeElement[]) {
        super()
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.attributeElements = List(attributeElements)
    }

    get representativeFlags(): List<string> {
        return this._representativeFlags
    }
}

/**
 * Attribute element is a part of the sortable compound. It defines the attribute name, the direction of the
 * sorting and the behaviour of the null values. The attribute name refers to the existing attribute.
 */
export class AttributeElement extends AbstractSchema {

    /**
     * Name of the existing attribute in the same schema.
     */
    readonly attributeName: string
    readonly behaviour: OrderBehaviour
    readonly direction: OrderDirection
    private _representativeFlags?: List<string>

    constructor(attributeName: string,
                behaviour: OrderBehaviour,
                direction: OrderDirection) {
        super()
        this.attributeName = attributeName
        this.behaviour = behaviour
        this.direction = direction
    }

    get representativeFlags(): List<string> {
        if(this._representativeFlags == undefined) {
            const flags: string[] = []

            if (this.direction === OrderDirection.Asc)
                flags.push(AttributeElementFlag.Asc)
            else if (this.direction === OrderDirection.Desc)
                flags.push(AttributeElementFlag.Desc)
            if (this.behaviour === OrderBehaviour.NullsLast)
                flags.push(AttributeElementFlag.NullsLast)
            else if (this.behaviour === OrderBehaviour.NullsFirst)
                flags.push(AttributeElementFlag.NullsFirst)

            this._representativeFlags = List(flags)
        }
        return this._representativeFlags
    }
}

export enum AttributeElementFlag {
    NullsFirst = '_attributeElement.nullsFirst',
    NullsLast = '_attributeElement.nullsLast',
    Asc = '_attributeElement.asc',
    Desc = '_attributeElement.desc'
}
