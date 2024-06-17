import {
    EntityPropertyValuePreviewStringContext
} from '@/modules/entity-viewer/viewer/workspace/EntityPropertyValuePreviewStringContext'

/**
 * Represents a single entity property value. It can be a wrapped scalar value or a custom object that needs special handling.
 */
export abstract class EntityPropertyValue {
    protected readonly emptyEntityPropertyValuePlaceholder: string = '<null>'

    protected constructor() {
    }

    /**
     * Returns the raw value of the entity property value.
     */
    abstract value(): any | any[] | undefined

    /**
     * Returns true if the raw entity property value is missing.
     */
    abstract isEmpty(): boolean

    /**
     * Returns a preview string representation of the entity property value. The method accepts context object
     * that can be used to influence the output.
     */
    abstract toPreviewString(context?: EntityPropertyValuePreviewStringContext): string
}
