import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import { serializeJsonWithBigInt } from '@/utils/JsonUtil'

/**
 * Represents a pointer to a referenced entity in another grid.
 */
export class EntityReferenceValue extends EntityPropertyValue {
    readonly primaryKey: number
    readonly representativeAttributes: EntityPropertyValue[]
    /**
     * The reference's own representative attributes, keyed by attribute name. Used to group and filter references
     * in the references / reference-attribute detail. `undefined` where not applicable (e.g. the parent column).
     */
    readonly representativeReferenceAttributes?: Map<string, EntityPropertyValue>
    /**
     * Representative attributes of the target (referenced) entity, keyed by attribute name. Used to display item
     * rows and PK-hover tooltips. `undefined` for non-managed reference types or where not applicable.
     */
    readonly targetRepresentativeAttributes?: Map<string, EntityPropertyValue>
    /**
     * Primary key of the referenced group entity, allowing it to be opened in a new grid. `undefined` when the
     * reference has no group or the group type is not managed by evitaDB (and thus not openable).
     */
    readonly groupPrimaryKey?: number

    constructor(primaryKey: number,
                representativeAttributes: EntityPropertyValue[],
                representativeReferenceAttributes?: Map<string, EntityPropertyValue>,
                targetRepresentativeAttributes?: Map<string, EntityPropertyValue>,
                groupPrimaryKey?: number) {
        super()
        this.primaryKey = primaryKey
        this.representativeAttributes = representativeAttributes
        this.representativeReferenceAttributes = representativeReferenceAttributes
        this.targetRepresentativeAttributes = targetRepresentativeAttributes
        this.groupPrimaryKey = groupPrimaryKey
    }

    value(): EvitaValue {
        return this
    }

    isEmpty(): boolean {
        return false
    }

    toRawString(): string {
        // a raw representation can hold a date-time value, whose seconds are a bigint that plain stringification rejects
        return serializeJsonWithBigInt(this.toRawRepresentation())
    }

    toRawRepresentation(): EvitaValue {
        return {
            primaryKey: this.primaryKey,
            representativeAttributes: this.representativeAttributes.map(x => x.toRawRepresentation())
        }
    }

    toPreviewString(): string {
        const flattenedRepresentativeAttributes: string[] = []
        for (const representativeAttribute of this.representativeAttributes) {
            const representativeAttributeValue = representativeAttribute.value()
            if (representativeAttributeValue == undefined) {
                return this.emptyEntityPropertyValuePlaceholder
            } else {
                flattenedRepresentativeAttributes.push(representativeAttributeValue.toString())
            }
        }
        if (flattenedRepresentativeAttributes.length === 0) {
            return `${this.primaryKey}`
        } else {
            return `${this.primaryKey}: ${flattenedRepresentativeAttributes.join(', ')}`
        }
    }

    /**
     * Builds the `PK: target representative attributes` line shown as a tooltip on the reference PK. Returns just
     * the primary key when no target representative attributes are available (e.g. non-managed reference types).
     */
    toTargetPreviewString(): string {
        const values: string[] = []
        if (this.targetRepresentativeAttributes != undefined) {
            for (const value of this.targetRepresentativeAttributes.values()) {
                const rawValue = value.value()
                if (rawValue != undefined) {
                    values.push(rawValue.toString())
                }
            }
        }
        if (values.length === 0) {
            return `${this.primaryKey}`
        }
        return `${this.primaryKey}: ${values.join(', ')}`
    }
}
