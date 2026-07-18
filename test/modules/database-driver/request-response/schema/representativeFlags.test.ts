import { describe, test, expect } from 'vitest'
import { List, Map } from 'immutable'
import { AttributeSchema, AttributeSchemaFlag } from '../../../../../src/modules/database-driver/request-response/schema/AttributeSchema'
import { EntityAttributeSchema, EntityAttributeSchemaFlag } from '../../../../../src/modules/database-driver/request-response/schema/EntityAttributeSchema'
import { GlobalAttributeSchema, GlobalAttributeSchemaFlag } from '../../../../../src/modules/database-driver/request-response/schema/GlobalAttributeSchema'
import { NamingConvention } from '../../../../../src/modules/database-driver/request-response/NamingConvetion'
import { Scalar } from '../../../../../src/modules/database-driver/data-type/Scalar'
import { EntityScope } from '../../../../../src/modules/database-driver/request-response/schema/EntityScope'
import { ScopedAttributeUniquenessType } from '../../../../../src/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType'
import { AttributeUniquenessType } from '../../../../../src/modules/database-driver/request-response/schema/AttributeUniquenessType'
import { ScopedGlobalAttributeUniquenessType } from '../../../../../src/modules/database-driver/request-response/schema/ScopedGlobalAttributeUniquenessType'
import { GlobalAttributeUniquenessType } from '../../../../../src/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType'
import { CatalogSchemaConverter } from '../../../../../src/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter'
import { GrpcAttributeSchemaType } from '../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import type { GrpcAttributeSchema } from '../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb'

const nameVariants = Map<NamingConvention, string>()

const uniqueWithinCollection = List([
    new ScopedAttributeUniquenessType(EntityScope.Live, AttributeUniquenessType.UniqueWithinCollection)
])

function flagNames(flags: List<{ flag: string }>): string[] {
    return flags.map(f => f.flag).toArray()
}

describe('AttributeSchema.representativeFlags', () => {
    test('exposes sortable and filterable flags when scopes are populated', () => {
        const schema = new AttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            List([EntityScope.Live]),
            List([EntityScope.Live]),
            List()
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).toContain(AttributeSchemaFlag.Sortable)
        expect(names).toContain(AttributeSchemaFlag.Filterable)
    })

    test('omits sortable and filterable flags when scopes are empty', () => {
        const schema = new AttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            List(), List(), List()
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).not.toContain(AttributeSchemaFlag.Sortable)
        expect(names).not.toContain(AttributeSchemaFlag.Filterable)
    })
})

describe('EntityAttributeSchema.representativeFlags', () => {
    test('exposes representative, sortable and filterable flags', () => {
        const schema = new EntityAttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            true,
            List([EntityScope.Live]),
            List([EntityScope.Live]),
            List()
        )
        const flags = schema.representativeFlags
        const names = flagNames(flags)
        expect(names).toContain(EntityAttributeSchemaFlag.Representative)
        expect(names).toContain(AttributeSchemaFlag.Sortable)
        expect(names).toContain(AttributeSchemaFlag.Filterable)
    })

    test('stores raw EntityScope values (not mdi icon strings) in Flag.icons', () => {
        const schema = new EntityAttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            false,
            List([EntityScope.Live]),
            List([EntityScope.Live]),
            List()
        )
        const sortable = schema.representativeFlags.find(f => f.flag === AttributeSchemaFlag.Sortable)!
        expect(sortable.icons).toEqual([EntityScope.Live])
        // guard against the double-mapping regression that stored 'mdi-*' strings
        expect(sortable.icons.every(i => !i.startsWith('mdi-'))).toBe(true)
    })
})

describe('GlobalAttributeSchema.representativeFlags', () => {
    test('exposes globally unique, sortable and filterable flags', () => {
        const schema = new GlobalAttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            false,
            List([EntityScope.Live]),
            List([EntityScope.Live]),
            List([new ScopedGlobalAttributeUniquenessType(EntityScope.Live, GlobalAttributeUniquenessType.UniqueWithinCatalog)]),
            List()
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).toContain(GlobalAttributeSchemaFlag.GloballyUnique)
        expect(names).toContain(AttributeSchemaFlag.Sortable)
        expect(names).toContain(AttributeSchemaFlag.Filterable)
    })

    test('exposes the representative flag when the global attribute is representative', () => {
        const schema = new GlobalAttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            true,
            List(), List(),
            List([new ScopedGlobalAttributeUniquenessType(EntityScope.Live, GlobalAttributeUniquenessType.UniqueWithinCatalog)]),
            List()
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).toContain(EntityAttributeSchemaFlag.Representative)
    })

    test('shows both globally unique and collection unique flags, globally unique first', () => {
        const schema = new GlobalAttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            false,
            List(), List(),
            List([new ScopedGlobalAttributeUniquenessType(EntityScope.Live, GlobalAttributeUniquenessType.UniqueWithinCatalog)]),
            uniqueWithinCollection
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).toContain(GlobalAttributeSchemaFlag.GloballyUnique)
        expect(names).toContain(AttributeSchemaFlag.Unique)
        expect(names.indexOf(GlobalAttributeSchemaFlag.GloballyUnique))
            .toBeLessThan(names.indexOf(AttributeSchemaFlag.Unique))
    })
})

describe('implicit filterable due to uniqueness (restored pre-#233 rule)', () => {
    test('AttributeSchema: unique attribute is filterable even with empty filteredInScopes', () => {
        const schema = new AttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            List(), List(), uniqueWithinCollection
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).toContain(AttributeSchemaFlag.Unique)
        expect(names).toContain(AttributeSchemaFlag.Filterable)
    })

    test('EntityAttributeSchema: unique attribute is filterable even with empty filteredInScopes', () => {
        const schema = new EntityAttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            false,
            List(), List(), uniqueWithinCollection
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).toContain(AttributeSchemaFlag.Filterable)
    })

    test('GlobalAttributeSchema: globally unique attribute is filterable even with empty filteredInScopes', () => {
        const schema = new GlobalAttributeSchema(
            'a', nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
            false,
            List(), List(),
            List([new ScopedGlobalAttributeUniquenessType(EntityScope.Live, GlobalAttributeUniquenessType.UniqueWithinCatalog)]),
            List()
        )
        const names = flagNames(schema.representativeFlags)
        expect(names).toContain(AttributeSchemaFlag.Filterable)
    })
})

describe('CatalogSchemaConverter.convertAttributeSchema class mapping', () => {
    const converter = new CatalogSchemaConverter()

    function grpcAttribute(schemaType: GrpcAttributeSchemaType): GrpcAttributeSchema {
        return {
            name: 'a',
            schemaType,
            type: 0, // GrpcEvitaDataType.STRING
            nameVariant: [],
            description: '',
            deprecationNotice: '',
            nullable: false,
            defaultValue: undefined,
            localized: false,
            indexedDecimalPlaces: 0,
            representative: false,
            sortableInScopes: [],
            filterableInScopes: [],
            uniqueInScopes: [],
            uniqueGloballyInScopes: []
        } as unknown as GrpcAttributeSchema
    }

    function convert(schemaType: GrpcAttributeSchemaType): AttributeSchema {
        return (converter as unknown as {
            convertAttributeSchema(attribute: GrpcAttributeSchema): AttributeSchema
        }).convertAttributeSchema(grpcAttribute(schemaType))
    }

    test('ENTITY_SCHEMA maps to EntityAttributeSchema', () => {
        const result = convert(GrpcAttributeSchemaType.ENTITY_SCHEMA)
        expect(result).toBeInstanceOf(EntityAttributeSchema)
        expect(result).not.toBeInstanceOf(GlobalAttributeSchema)
    })

    test('REFERENCE_SCHEMA maps to plain AttributeSchema', () => {
        const result = convert(GrpcAttributeSchemaType.REFERENCE_SCHEMA)
        expect(result).toBeInstanceOf(AttributeSchema)
        expect(result).not.toBeInstanceOf(EntityAttributeSchema)
    })

    test('GLOBAL_SCHEMA maps to GlobalAttributeSchema', () => {
        const result = convert(GrpcAttributeSchemaType.GLOBAL_SCHEMA)
        expect(result).toBeInstanceOf(GlobalAttributeSchema)
    })
})
