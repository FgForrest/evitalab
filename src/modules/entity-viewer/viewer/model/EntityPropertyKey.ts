import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Represents key of a single typed entity property.
 */
export class EntityPropertyKey {
    static readonly entityPropertyPartSeparator: string = ':'

    readonly type: EntityPropertyType
    readonly names: string[]

    get parentName(): string {
        if (this.names.length < 2) {
            throw new UnexpectedError(`Parent name of entity property for type ${this.type} is not supported`)
        }
        return this.names[0]
    }

    get name(): string {
        if (this.names.length === 0) {
            throw new UnexpectedError(`Name of entity property for type ${this.type} is not supported`)
        }
        return this.names.at(-1)!
    }

    private constructor(type: EntityPropertyType, names: string[] = []) {
        this.type = type
        if (names.length > 2) {
            throw new UnexpectedError(`Cannot create entity property key with more than two names: ${names}`)
        }
        this.names = names
    }

    static entity(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Entity, [name])
    }

    static attributes(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Attributes, [name])
    }

    static associatedData(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.AssociatedData, [name])
    }

    static prices(): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.Prices)
    }

    static references(name: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.References, [name])
    }

    static referenceAttributes(referenceName: string, attributeName: string): EntityPropertyKey {
        return new EntityPropertyKey(EntityPropertyType.ReferenceAttributes, [referenceName, attributeName])
    }

    static fromString(propertyKey: string): EntityPropertyKey {
        const parts = propertyKey.split(EntityPropertyKey.entityPropertyPartSeparator)

        if (parts[0] === EntityPropertyType.Attributes) {
            return new EntityPropertyKey(EntityPropertyType.Attributes, parts.slice(1))
        } else if (parts[0] === EntityPropertyType.AssociatedData) {
            return new EntityPropertyKey(EntityPropertyType.AssociatedData, parts.slice(1))
        } else if (parts[0] === EntityPropertyType.References) {
            return new EntityPropertyKey(EntityPropertyType.References, parts.slice(1))
        } else if (parts[0] === EntityPropertyType.ReferenceAttributes) {
            return new EntityPropertyKey(EntityPropertyType.ReferenceAttributes, parts.slice(1))
        } else {
            return new EntityPropertyKey(EntityPropertyType.Entity, parts)
        }
    }

    supportsName(): boolean {
        return this.names.length > 0
    }

    toString(): string {
        if (this.type === EntityPropertyType.Entity) {
            return this.names.join(EntityPropertyKey.entityPropertyPartSeparator)
        }
        if (this.names.length === 0) {
            return this.type
        }
        return `${this.type}${EntityPropertyKey.entityPropertyPartSeparator}${this.names.join(EntityPropertyKey.entityPropertyPartSeparator)}`
    }
}
