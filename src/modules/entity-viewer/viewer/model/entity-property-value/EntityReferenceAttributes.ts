import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import { serializeJsonWithBigInt } from '@/utils/JsonUtil'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'

/**
 * Holder for a single reference-attribute column value of an entity displayable in the data grid. The grid cell
 * renders the same reference count summary as the references column; the grouped/filterable list of the actual
 * attribute values lives in the cell detail.
 */
export class EntityReferenceAttributes extends EntityPropertyValue {
    readonly referenceName: string
    readonly attributeName: string
    readonly values: EntityReferenceValue[]

    constructor(referenceName: string, attributeName: string, values: EntityReferenceValue[]) {
        super()
        this.referenceName = referenceName
        this.attributeName = attributeName
        this.values = values
    }

    count(): number {
        return this.values.length
    }

    value(): EvitaValue {
        return this
    }

    isEmpty(): boolean {
        return this.values.length === 0
    }

    toRawString(): string {
        // a raw representation can hold a date-time value, whose seconds are a bigint that plain stringification rejects
        return serializeJsonWithBigInt(this.toRawRepresentation())
    }

    toRawRepresentation(): EvitaValue {
        return {
            referenceName: this.referenceName,
            attributeName: this.attributeName,
            values: this.values.map(x => x.toRawRepresentation())
        }
    }

    toPreviewString(): string {
        const count: number = this.count()
        return count === 1
            ? `${count} ${this.referenceName} reference`
            : `${count} ${this.referenceName} references`
    }
}
