import { test, expect, describe } from 'vitest'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'
import { Reference } from '@/modules/database-driver/request-response/data/Reference'
import { EntityReference } from '@/modules/database-driver/request-response/data/EntityReference'
import { Attributes } from '@/modules/database-driver/request-response/data/Attributes'
import { AssociatedData } from '@/modules/database-driver/request-response/data/AssociatedData'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'

function reference(referenceName: string, referencedPrimaryKey: number): Reference {
    return new Reference(
        referenceName,
        1,
        new EntityReference(`${referenceName}Entity`, referencedPrimaryKey, 1),
        undefined,
        new Attributes(ImmutableMap(), ImmutableMap()),
        Cardinality.ZeroOrMore
    )
}

function entity(references: Reference[]): Entity {
    return new Entity(
        'Product',
        1,
        1,
        1,
        undefined,
        new Attributes(ImmutableMap(), ImmutableMap()),
        new AssociatedData(ImmutableMap(), ImmutableMap()),
        ImmutableList(references),
        PriceInnerRecordHandling.None,
        ImmutableList(),
        undefined,
        ImmutableList(),
        EntityScope.Live
    )
}

describe('Entity references', () => {
    test('Should return all references of a name, in server order', () => {
        const brand = reference('brand', 1)
        const firstParameter = reference('parameter', 10)
        const secondParameter = reference('parameter', 11)

        const referencesOfName = entity([firstParameter, brand, secondParameter]).referencesOfName('parameter')

        expect(referencesOfName.toArray()).toEqual([firstParameter, secondParameter])
    })

    test('Should return an empty list for a name the entity has no reference of', () => {
        expect(entity([reference('brand', 1)]).referencesOfName('parameter').isEmpty()).toBe(true)
    })

    test('Should look a single reference up by name and referenced primary key', () => {
        const wanted = reference('parameter', 11)

        const found = entity([reference('parameter', 10), wanted]).reference('parameter', 11)

        expect(found).toBe(wanted)
    })

    test('Should return undefined when no reference of the name points to the primary key', () => {
        expect(entity([reference('parameter', 10)]).reference('parameter', 11)).toBeUndefined()
        expect(entity([reference('parameter', 10)]).reference('brand', 10)).toBeUndefined()
    })

    test('Should report each reference name once', () => {
        const names = entity([
            reference('parameter', 10),
            reference('brand', 1),
            reference('parameter', 11)
        ]).referenceNames

        expect(names.toArray().sort()).toEqual(['brand', 'parameter'])
    })

    test('Should report no reference names for an entity without references', () => {
        expect(entity([]).referenceNames.isEmpty()).toBe(true)
    })
})
