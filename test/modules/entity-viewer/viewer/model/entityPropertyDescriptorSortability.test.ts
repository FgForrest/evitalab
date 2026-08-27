import { describe, expect, test } from 'vitest'
import { List, Map } from 'immutable'
import { EntityPropertyDescriptor } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyKey } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyType } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '../../../../../src/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { AttributeSchema } from '../../../../../src/modules/database-driver/request-response/schema/AttributeSchema'
import {
    ReferenceAttributeSchema
} from '../../../../../src/modules/database-driver/request-response/schema/ReferenceAttributeSchema'
import { ReferenceSchema } from '../../../../../src/modules/database-driver/request-response/schema/ReferenceSchema'
import {
    AssociatedDataSchema
} from '../../../../../src/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { EntityScope } from '../../../../../src/modules/database-driver/request-response/schema/EntityScope'
import {
    ScopedReferenceIndexType
} from '../../../../../src/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType'
import { ReferenceIndexType } from '../../../../../src/modules/database-driver/request-response/schema/ReferenceIndexType'
import { Cardinality } from '../../../../../src/modules/database-driver/request-response/schema/Cardinality'
import { NamingConvention } from '../../../../../src/modules/database-driver/request-response/NamingConvetion'
import { Scalar } from '../../../../../src/modules/database-driver/data-type/Scalar'

const nameVariants = Map<NamingConvention, string>()

function attribute(sortableInScopes: EntityScope[]): AttributeSchema {
    return new AttributeSchema(
        'code', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
        List(sortableInScopes), List(), List()
    )
}

function referenceAttribute(sortableInScopes: EntityScope[]): ReferenceAttributeSchema {
    return new ReferenceAttributeSchema(
        'priority', nameVariants, undefined, undefined, Scalar.Integer, false, undefined, false, 0,
        false, List(sortableInScopes), List(), List()
    )
}

function reference(indexedInScopes: EntityScope[]): ReferenceSchema {
    return new ReferenceSchema(
        'tags', nameVariants, undefined, undefined, 'Tag', true, nameVariants,
        undefined, undefined, undefined, Cardinality.ZeroOrMore, [], [],
        List(indexedInScopes.map(scope => new ScopedReferenceIndexType(scope, ReferenceIndexType.ForFiltering))),
        List(), List(), List(), List()
    )
}

function primaryKeyDescriptor(): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(
        EntityPropertyType.Entity,
        EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey),
        'Primary key', 'Primary key', undefined, undefined, List()
    )
}

function attributeDescriptor(sortableInScopes: EntityScope[]): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(
        EntityPropertyType.Attributes,
        EntityPropertyKey.attributes('code'),
        'code', 'code', undefined, attribute(sortableInScopes), List()
    )
}

function referenceAttributeDescriptor(sortableInScopes: EntityScope[],
                                      indexedInScopes: EntityScope[]): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(
        EntityPropertyType.ReferenceAttributes,
        EntityPropertyKey.referenceAttributes('tags', 'priority'),
        'priority', 'tags: priority',
        reference(indexedInScopes), referenceAttribute(sortableInScopes), List()
    )
}

function associatedDataDescriptor(): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(
        EntityPropertyType.AssociatedData,
        EntityPropertyKey.associatedData('localization'),
        'localization', 'localization', undefined,
        new AssociatedDataSchema(
            'localization', nameVariants, undefined, undefined, Scalar.ComplexDataObject, false, false
        ),
        List()
    )
}

describe('EntityPropertyDescriptor.isSortable', () => {

    test('primary key is sortable regardless of the selected scopes', () => {
        // guards the static property list being built from a string instead of an array of strings, which silently
        // produced a list of single characters and made the primary key column non-sortable
        const descriptor = primaryKeyDescriptor()
        expect(descriptor.isSortable([])).toBe(true)
        expect(descriptor.isSortable([EntityScope.Live])).toBe(true)
        expect(descriptor.isSortable([EntityScope.Live, EntityScope.Archive])).toBe(true)
    })

    test('attribute sortable in the only selected scope is sortable', () => {
        expect(attributeDescriptor([EntityScope.Live]).isSortable([EntityScope.Live])).toBe(true)
    })

    test('attribute sortable in only some of the selected scopes is not sortable', () => {
        // evitaDB requires the sortable trait in every requested scope
        expect(attributeDescriptor([EntityScope.Live]).isSortable([EntityScope.Live, EntityScope.Archive])).toBe(false)
    })

    test('attribute sortable in no scope is not sortable', () => {
        expect(attributeDescriptor([]).isSortable([EntityScope.Live])).toBe(false)
    })

    test('attribute is sortable when no scope is selected', () => {
        // no scope selected degrades the query to one without any scope restriction, so sortability is unrestricted too
        expect(attributeDescriptor([EntityScope.Live]).isSortable([])).toBe(true)
    })

    test('reference attribute is sortable when the reference is indexed in all selected scopes', () => {
        const descriptor = referenceAttributeDescriptor(
            [EntityScope.Live, EntityScope.Archive],
            [EntityScope.Live, EntityScope.Archive]
        )
        expect(descriptor.isSortable([EntityScope.Live, EntityScope.Archive])).toBe(true)
    })

    test('reference attribute is not sortable when the reference is not indexed in all selected scopes', () => {
        const descriptor = referenceAttributeDescriptor(
            [EntityScope.Live, EntityScope.Archive],
            [EntityScope.Live]
        )
        expect(descriptor.isSortable([EntityScope.Live, EntityScope.Archive])).toBe(false)
    })

    test('associated data is never sortable', () => {
        expect(associatedDataDescriptor().isSortable([EntityScope.Live])).toBe(false)
    })
})
