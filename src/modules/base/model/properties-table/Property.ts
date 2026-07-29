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
    /**
     * Optional explanation of the property rendered as an info icon with a tooltip next to the row label
     */
    readonly description?: string

    constructor(name: string, value: PropertyValue | List<PropertyValue>, description?: string) {
        this.name = name
        this.value = value
        this.description = description
    }
}
