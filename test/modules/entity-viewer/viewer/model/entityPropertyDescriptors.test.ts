import { describe, expect, test } from 'vitest'
import { List } from 'immutable'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyDescriptors } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptors'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'

function descriptor(type: EntityPropertyType,
                    key: EntityPropertyKey,
                    children: List<EntityPropertyDescriptor> = List()): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(type, key, key.toString(), key.toString(), undefined, undefined, children)
}

function reference(name: string, attributeNames: string[]): EntityPropertyDescriptor[] {
    const attributes: EntityPropertyDescriptor[] = attributeNames.map(attributeName => descriptor(
        EntityPropertyType.ReferenceAttributes,
        EntityPropertyKey.referenceAttributes(name, attributeName)
    ))
    return [
        descriptor(EntityPropertyType.References, EntityPropertyKey.references(name), List(attributes)),
        ...attributes
    ]
}

/**
 * Flat list in display order as built by the service: static properties, attributes (enough of them to exceed the
 * 8 entries up to which an Immutable `Map` happens to keep insertion order), associated data, prices and each
 * reference followed by its reference attributes.
 */
function displayOrderedDescriptors(): EntityPropertyDescriptor[] {
    return [
        descriptor(EntityPropertyType.Entity, EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey)),
        descriptor(EntityPropertyType.Entity, EntityPropertyKey.entity(StaticEntityProperties.Version)),
        ...Array.from({ length: 40 }, (_, i) =>
            descriptor(EntityPropertyType.Attributes, EntityPropertyKey.attributes(`attribute${i}`))),
        descriptor(EntityPropertyType.AssociatedData, EntityPropertyKey.associatedData('localization')),
        descriptor(EntityPropertyType.Prices, EntityPropertyKey.prices()),
        ...reference('brand', ['order', 'note']),
        ...reference('tags', [])
    ]
}

describe('EntityPropertyDescriptors', () => {

    test('index keeps the input order beyond 8 entries', () => {
        const input: EntityPropertyDescriptor[] = displayOrderedDescriptors()

        const descriptors = new EntityPropertyDescriptors(List(input))

        expect(Array.from(descriptors.index.keys())).toEqual(input.map(it => it.key.toString()))
    })

    test('sections group top-level properties in input order and leave reference attributes under their reference', () => {
        const input: EntityPropertyDescriptor[] = displayOrderedDescriptors()

        const descriptors = new EntityPropertyDescriptors(List(input))

        expect(Array.from(descriptors.sections.keys())).toEqual([
            EntityPropertyType.Entity,
            EntityPropertyType.Attributes,
            EntityPropertyType.AssociatedData,
            EntityPropertyType.Prices,
            EntityPropertyType.References
        ])
        expect(descriptors.sections.has(EntityPropertyType.ReferenceAttributes)).toBe(false)
        expect(descriptors.sections.get(EntityPropertyType.Attributes)!.map(it => it.key.toString()).toArray())
            .toEqual(Array.from({ length: 40 }, (_, i) => `attributes:attribute${i}`))
        expect(descriptors.sections.get(EntityPropertyType.References)!.map(it => it.key.toString()).toArray())
            .toEqual(['references:brand', 'references:tags'])
    })

    test('children of a reference are the same instances as the index entries', () => {
        const descriptors = new EntityPropertyDescriptors(List(displayOrderedDescriptors()))

        const brand: EntityPropertyDescriptor = descriptors.get(EntityPropertyKey.references('brand'))!

        expect(brand.children.size).toBe(2)
        brand.children.forEach(child => expect(descriptors.get(child.key)).toBe(child))
    })

    test('get and has accept both keys and their string form', () => {
        const descriptors = new EntityPropertyDescriptors(List(displayOrderedDescriptors()))

        expect(descriptors.has(EntityPropertyKey.attributes('attribute3'))).toBe(true)
        expect(descriptors.has('attributes:attribute3')).toBe(true)
        expect(descriptors.get('attributes:attribute3')).toBe(descriptors.get(EntityPropertyKey.attributes('attribute3')))
        expect(descriptors.has('attributes:unknown')).toBe(false)
        expect(descriptors.get('attributes:unknown')).toBeUndefined()
    })

    test('order returns the keys in index order regardless of the input order', () => {
        const descriptors = new EntityPropertyDescriptors(List(displayOrderedDescriptors()))

        const ordered: EntityPropertyKey[] = descriptors.order([
            EntityPropertyKey.referenceAttributes('brand', 'note'),
            EntityPropertyKey.prices(),
            EntityPropertyKey.attributes('attribute12'),
            EntityPropertyKey.attributes('attribute2'),
            EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey)
        ])

        expect(ordered.map(it => it.toString())).toEqual([
            'primaryKey',
            'attributes:attribute2',
            'attributes:attribute12',
            'prices',
            'referenceAttributes:brand:note'
        ])
    })

    test('order drops unknown keys and duplicates', () => {
        const descriptors = new EntityPropertyDescriptors(List(displayOrderedDescriptors()))

        const ordered: EntityPropertyKey[] = descriptors.order([
            EntityPropertyKey.attributes('attribute1'),
            EntityPropertyKey.attributes('unknown'),
            EntityPropertyKey.attributes('attribute1')
        ])

        expect(ordered.map(it => it.toString())).toEqual(['attributes:attribute1'])
    })

    test('order replaces foreign key instances with the index own instances', () => {
        const descriptors = new EntityPropertyDescriptors(List(displayOrderedDescriptors()))
        const foreignKey: EntityPropertyKey = EntityPropertyKey.fromString('attributes:attribute5')

        const ordered: EntityPropertyKey[] = descriptors.order([foreignKey])

        expect(ordered[0]).not.toBe(foreignKey)
        expect(ordered[0]).toBe(descriptors.get('attributes:attribute5')!.key)
    })

    test('empty descriptors have no properties', () => {
        const descriptors = EntityPropertyDescriptors.empty()

        expect(descriptors.index.size).toBe(0)
        expect(descriptors.sections.size).toBe(0)
        expect(descriptors.order([EntityPropertyKey.prices()])).toEqual([])
    })
})
