import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { MultiValueFlagValue } from '@/modules/base/model/properties-table/MultiValueFlagValue'
import { NotApplicableValue } from '@/modules/base/model/properties-table/NotApplicableValue'
import { RangeValue } from '@/modules/base/model/properties-table/RangeValue'
import { ProgressValue } from '@/modules/base/model/properties-table/ProgressValue'
import { PlaceholderValue } from '@/modules/base/model/properties-table/PlaceholderValue'

/**
 * Holder of a single value of a property
 */
export class PropertyValue {
    /**
     * Actual value of the property
     */
    readonly value: PropertyValueValue
    /**
     * Side note of this value
     */
    readonly note?: string
    /**
     * Action to be performed when this value is clicked
     */
    readonly action?: ((item?: string) => void)

    constructor(value: PropertyValueValue, note?: string, action?: ((item?: string) => void)) {
        this.value = value
        this.note = note
        this.action = action
    }
}

/**
 * Union of all supported types of property values
 */
type PropertyValueValue =
    undefined
    | boolean
    | string
    | number
    | KeywordValue
    | MultiValueFlagValue
    | NotApplicableValue
    | RangeValue
    | ProgressValue
    | PlaceholderValue
