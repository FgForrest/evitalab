import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { List } from 'immutable'

/**
 * Single property of a table (row)
 */
export class Property {

    /**
     * Name of the property
     */
    readonly name: string
    /**
     * Value of the property
     */
    readonly value: PropertyValue | List<PropertyValue>

    constructor(name: string, value: PropertyValue | List<PropertyValue>) {
        this.name = name
        this.value = value
    }
}
