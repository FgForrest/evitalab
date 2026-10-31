import { describe, expect, test } from 'vitest'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { BigintNumberRange } from '@/modules/database-driver/data-type/BigintNumberRange'
import { IntegerRange } from '@/modules/database-driver/data-type/IntegerRange'
import { Predecessor } from '@/modules/database-driver/data-type/Predecessor'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { formatDataGridValue } from '@/modules/base/service/data-grid/dataGridFormat'

const uuidCode: string = '123e4567-e89b-12d3-a456-426614174000'

describe('NativeValue string forms', () => {
    test('prints a UUID, whose bits are bigint', () => {
        const value: NativeValue = new NativeValue(Uuid.fromCode(uuidCode))
        expect(value.toPreviewString()).toBe(uuidCode)
    })

    test('previews number ranges by their own string form', () => {
        expect(new NativeValue(new BigintNumberRange(1n, 2n)).toPreviewString()).toBe('[1, 2]')
        expect(new NativeValue(new IntegerRange(1, undefined)).toPreviewString()).toBe('1,∞')
    })

    test('previews a plain object with a bigint leaf as JSON', () => {
        expect(new NativeValue({ id: 5n, name: 'a' }).toPreviewString()).toBe('{"id":"5","name":"a"}')
    })

    test('previews an array as JSON', () => {
        expect(new NativeValue([1, 'a'] as unknown as object).toPreviewString()).toBe('[1,"a"]')
    })

    test('previews primitives by their string form', () => {
        expect(new NativeValue(42n).toPreviewString()).toBe('42')
        expect(new NativeValue('text').toPreviewString()).toBe('text')
    })

    test('previews a predecessor', () => {
        expect(new NativeValue(new Predecessor(false, 5)).toPreviewString()).toBe('5')
    })

    test('previews a missing value as a placeholder', () => {
        expect(new NativeValue(undefined).toPreviewString()).toBe('<null>')
    })

    test('previews null, which GraphQL results carry for missing values, like a missing value', () => {
        expect(new NativeValue(null as unknown as undefined).toPreviewString()).toBe('<null>')
    })
})

describe('data types in the generic data grid', () => {
    test('print their canonical string form instead of JSON by default', () => {
        expect(formatDataGridValue(Uuid.fromCode(uuidCode))).toBe(uuidCode)
        expect(formatDataGridValue(new BigDecimal('10.50'))).toBe('10.50')
        expect(formatDataGridValue(new Currency('EUR'))).toBe('EUR')
        expect(formatDataGridValue(new Locale('cs-CZ'))).toBe('cs-CZ')
        expect(formatDataGridValue(new Predecessor(true, -1))).toBe('Head')
    })
})
