import { describe, expect, test } from 'vitest'
import {
    formatResultDuration,
    formatResultSize,
    utf8ByteLength
} from '@/modules/console/result-status/service/resultStatusFormatting'
import { ResultSizeUnit } from '@/modules/console/result-status/model/ResultSizeUnit'

describe('Result status formatting', () => {
    test('Should scale sizes to bytes, kilobytes and megabytes', () => {
        expect(formatResultSize(0)).toEqual({ unit: ResultSizeUnit.Bytes, value: '0' })
        expect(formatResultSize(1023)).toEqual({ unit: ResultSizeUnit.Bytes, value: '1023' })
        expect(formatResultSize(1024)).toEqual({ unit: ResultSizeUnit.Kilobytes, value: '1.0' })
        expect(formatResultSize(40_468)).toEqual({ unit: ResultSizeUnit.Kilobytes, value: '39.5' })
        expect(formatResultSize(8_483_381)).toEqual({ unit: ResultSizeUnit.Megabytes, value: '8.1' })
    })

    test('Should round durations to whole milliseconds', () => {
        expect(formatResultDuration(17.4)).toBe('17')
        expect(formatResultDuration(17.5)).toBe('18')
    })

    test('Should count UTF-8 bytes, not characters', () => {
        expect(utf8ByteLength('{"a":1}')).toBe(7)
        expect(utf8ByteLength('"ž"')).toBe(4)
    })
})
