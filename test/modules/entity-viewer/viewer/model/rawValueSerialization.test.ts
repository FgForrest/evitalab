import { describe, expect, test } from 'vitest'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { EntityPrices } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrices'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { Currency } from '@/modules/database-driver/data-type/Currency'
import { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Price } from '@/modules/database-driver/request-response/data/Price'

/**
 * The grid renders a cell it cannot pretty-print through the raw representation of its value. Timestamps keep their
 * seconds as a `bigint`, so a value holding a date-time - a price validity, a reference attribute - used to make the
 * plain stringification throw and left the cell unrendered.
 */
// the seconds of a received timestamp are a bigint, which is exactly what breaks the plain stringification
const validFrom: OffsetDateTime = OffsetDateTime.of(1_700_000_000n, 0, '+01:00')
const validTo: OffsetDateTime = OffsetDateTime.of(1_800_000_000n, 0, '+01:00')

function price(validity: DateTimeRange | undefined): EntityPrice {
    return EntityPrice.fromPrice(new Price(
        1,
        'basic',
        undefined,
        new BigDecimal('10.0'),
        new BigDecimal('21.0'),
        new BigDecimal('12.1'),
        validity,
        true,
        1,
        new Currency('EUR')
    ))
}

describe('raw value serialization', () => {
    test('a price with a validity range is rendered', () => {
        const validity: DateTimeRange = new DateTimeRange(validFrom, validTo)

        expect(() => price(validity).toRawString()).not.toThrow()
        expect(price(validity).toRawString()).toContain('1700000000')
        // stringifying the representation directly is what used to fail
        expect(() => JSON.stringify(price(validity).toRawRepresentation())).toThrow(TypeError)
    })

    test('a collection of prices with a validity range is rendered', () => {
        const prices: EntityPrices = new EntityPrices(undefined, [price(new DateTimeRange(validFrom, validTo))])

        expect(() => prices.toRawString()).not.toThrow()
    })

    test('a reference with a date-time attribute is rendered', () => {
        const reference: EntityReferenceValue = new EntityReferenceValue(
            1,
            [new NativeValue(validFrom)]
        )

        expect(() => reference.toRawString()).not.toThrow()
    })
})
