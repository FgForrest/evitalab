import { describe, expect, test } from 'vitest'
import { List, Map } from 'immutable'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'

function descriptor(type: EntityPropertyType, key: EntityPropertyKey, schema?: Schema): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(type, key, key.toString(), key.toString(), undefined, schema, List())
}

function entityProperty(name: StaticEntityProperties): EntityPropertyDescriptor {
    return descriptor(EntityPropertyType.Entity, EntityPropertyKey.entity(name))
}

function attributeProperty(name: string, type: Scalar): EntityPropertyDescriptor {
    return descriptor(EntityPropertyType.Attributes, EntityPropertyKey.attributes(name), new AttributeSchema(name,
        Map<NamingConvention, string>(), undefined, undefined, type, true, undefined, false, 0, List(), List(), List()))
}

describe('EntityPropertyDescriptor.scalar', () => {
    test('Should resolve the scalar of attributes and associated data from their schema', () => {
        expect(attributeProperty('code', Scalar.Short).scalar).toBe(Scalar.Short)
        expect(descriptor(
            EntityPropertyType.AssociatedData,
            EntityPropertyKey.associatedData('data'),
            new AssociatedDataSchema('data', Map<NamingConvention, string>(), undefined, undefined, Scalar.ComplexDataObject, true, false)
        ).scalar).toBe(Scalar.ComplexDataObject)
    })

    test('Should resolve the scalar of static entity properties', () => {
        expect(entityProperty(StaticEntityProperties.PrimaryKey).scalar).toBe(Scalar.Integer)
        expect(entityProperty(StaticEntityProperties.Version).scalar).toBe(Scalar.Integer)
        expect(entityProperty(StaticEntityProperties.Locales).scalar).toBe(Scalar.LocaleArray)
    })

    test('Should resolve no scalar for enum and composite properties', () => {
        expect(entityProperty(StaticEntityProperties.Scope).scalar).toBeUndefined()
        expect(entityProperty(StaticEntityProperties.PriceInnerRecordHandling).scalar).toBeUndefined()
        expect(entityProperty(StaticEntityProperties.ParentPrimaryKey).scalar).toBeUndefined()
        expect(descriptor(EntityPropertyType.Prices, EntityPropertyKey.prices()).scalar).toBeUndefined()
        expect(descriptor(EntityPropertyType.References, EntityPropertyKey.references('tags')).scalar).toBeUndefined()
        expect(descriptor(
            EntityPropertyType.ReferenceAttributes,
            EntityPropertyKey.referenceAttributes('tags', 'note')
        ).scalar).toBeUndefined()
    })
})
