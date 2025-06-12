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

    toRawString(): string {
        return JSON.stringify({ primaryKey: this.primaryKey, representativeAttributes: this.representativeAttributes })
    }

    toRawRepresentation(): any {
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
}
