import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'

/**
 * Holder for all references of a single reference name of an entity displayable in the data grid. The grid cell
 * renders the reference count summary; the full grouped/filterable list lives in the cell detail.
 */
export class EntityReferences extends EntityPropertyValue {
    readonly referenceName: string
    readonly references: EntityReferenceValue[]

    constructor(referenceName: string, references: EntityReferenceValue[]) {
        super()
        this.referenceName = referenceName
        this.references = references
    }

    count(): number {
        return this.references.length
    }

    value(): EvitaValue {
        return this
    }

    isEmpty(): boolean {
        return this.references.length === 0
    }

    toRawString(): string {
        return JSON.stringify(this.toRawRepresentation())
    }

    toRawRepresentation(): EvitaValue {
        return {
            referenceName: this.referenceName,
            references: this.references.map(x => x.toRawRepresentation())
        }
    }

    toPreviewString(): string {
        const count: number = this.count()
        return count === 1
            ? `${count} ${this.referenceName} reference`
            : `${count} ${this.referenceName} references`
    }
}
