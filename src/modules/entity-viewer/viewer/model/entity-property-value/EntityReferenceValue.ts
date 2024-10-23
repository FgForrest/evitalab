import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'

/**
 * Represents a pointer to a referenced entity in another grid.
 */
export class EntityReferenceValue extends EntityPropertyValue {
    readonly primaryKey: number
    readonly representativeAttributes: EntityPropertyValue[]

    constructor(primaryKey: number, representativeAttributes: EntityPropertyValue[]) {
        super()
        this.primaryKey = primaryKey
        this.representativeAttributes = representativeAttributes
    }

    value(): any {
        return this
    }

    isEmpty(): boolean {
        return false
    }

    toPreviewString(): string {
        const flattenedRepresentativeAttributes: string[] = []
        for (const representativeAttribute of this.representativeAttributes) {
            const representativeAttributeValue = representativeAttribute.value()
            if (representativeAttributeValue == undefined) {
                return super.emptyEntityPropertyValuePlaceholder
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
}
