import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import type {
    EntityViewerPrintContext
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityViewerPrintContext'

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
    abstract value(): EvitaValue | EvitaValue[] | undefined

    /**
     * Returns true if the raw entity property value is missing.
     */
    abstract isEmpty(): boolean

    /**
     * Returns a preview string representation of the entity property value. The method accepts context object
     * that can be used to influence the output.
     */
    abstract toPreviewString(context?: EntityViewerPrintContext): string

    abstract toRawString(): string
    abstract toRawRepresentation(): EvitaValue
}
