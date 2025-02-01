import { test, expect } from 'vitest'
import { parseHumanByteSizeToBigInt, round } from '../../src/utils/number'
import { parseHumanCountToNumber, parseHumanCountToBigInt } from '../../src/utils/number'

test('Should round to specific decimal places', () => {
    expect(round(12.12543, 0)).toEqual(12)
    expect(round(12.12543, 5)).toEqual(12.12543)
    expect(round(12.12543, 2)).toEqual(12.13)
})

test('Should parse human count to number', () => {
    expect(parseHumanCountToNumber('123')).toEqual(123)
    expect(parseHumanCountToNumber('123.3')).toEqual(123.3)
    expect(parseHumanCountToNumber('123k')).toEqual(123000)
    expect(parseHumanCountToNumber('123.3k')).toEqual(123300)
    expect(parseHumanCountToNumber('123.33345k')).toEqual(123333.45)
    expect(parseHumanCountToNumber('123M')).toEqual(123000000)
    expect(parseHumanCountToNumber('123.3M')).toEqual(123300000)
    expect(parseHumanCountToNumber('123G')).toEqual(123000000000)
    expect(parseHumanCountToNumber('123.3G')).toEqual(123300000000)
    expect(parseHumanCountToNumber('123.3 G')).toEqual(123300000000)
})

test('Should not parse human count to number', () => {
    expect(() => parseHumanCountToNumber('dfg')).toThrowError()
    expect(() => parseHumanCountToNumber('123m')).toThrowError()
    expect(() => parseHumanCountToNumber(' 123 ')).toThrowError()
})

test('Should parse human count to bigint', () => {
    expect(parseHumanCountToBigInt('123')).toEqual([123n, false])
    expect(parseHumanCountToBigInt('123k')).toEqual([123000n, false])
    expect(parseHumanCountToBigInt('123.3k')).toEqual([123300n, false])
    expect(parseHumanCountToBigInt('123.0k')).toEqual([123000n, false])
    expect(parseHumanCountToBigInt('123.333k')).toEqual([123333n, false])
    expect(parseHumanCountToBigInt('123.33355k')).toEqual([123334n, true])
    expect(parseHumanCountToBigInt('123.333000k')).toEqual([123333n, false])
    expect(parseHumanCountToBigInt('123M')).toEqual([123000000n, false])
    expect(parseHumanCountToBigInt('123.3M')).toEqual([123300000n, false])
    expect(parseHumanCountToBigInt('123.333333M')).toEqual([123333333n, false])
    expect(parseHumanCountToBigInt('123.333333000M')).toEqual([123333333n, false])
    expect(parseHumanCountToBigInt('123G')).toEqual([123000000000n, false])
    expect(parseHumanCountToBigInt('123.3G')).toEqual([123300000000n, false])
    expect(parseHumanCountToBigInt('123.333333333G')).toEqual([123333333333n, false])
    expect(parseHumanCountToBigInt('123.333333333000G')).toEqual([123333333333n, false])
    expect(parseHumanCountToBigInt('123.3 G')).toEqual([123300000000n, false])
})

test('Should not parse human count to bigint', () => {
    expect(() => parseHumanCountToBigInt('dfg')).toThrowError()
    expect(() => parseHumanCountToBigInt('123m')).toThrowError()
    expect(() => parseHumanCountToBigInt(' 123 ')).toThrowError()
})

test('Should parse human byte size to bigint', () => {
    expect(parseHumanByteSizeToBigInt('123')).toEqual([123n, false])
    expect(parseHumanByteSizeToBigInt('123k')).toEqual([123000n, false])
    expect(parseHumanByteSizeToBigInt('123.3k')).toEqual([123300n, false])
    expect(parseHumanByteSizeToBigInt('123.0k')).toEqual([123000n, false])
    expect(parseHumanByteSizeToBigInt('123.333k')).toEqual([123333n, false])
    expect(parseHumanByteSizeToBigInt('123.33355k')).toEqual([123334n, true])
    expect(parseHumanByteSizeToBigInt('123.333000k')).toEqual([123333n, false])
    expect(parseHumanByteSizeToBigInt('123M')).toEqual([123000000n, false])
    expect(parseHumanByteSizeToBigInt('123.3M')).toEqual([123300000n, false])
    expect(parseHumanByteSizeToBigInt('123.333333M')).toEqual([123333333n, false])
    expect(parseHumanByteSizeToBigInt('123.333333000M')).toEqual([123333333n, false])
    expect(parseHumanByteSizeToBigInt('123G')).toEqual([123000000000n, false])
    expect(parseHumanByteSizeToBigInt('123.3G')).toEqual([123300000000n, false])
    expect(parseHumanByteSizeToBigInt('123.333333333G')).toEqual([123333333333n, false])
    expect(parseHumanByteSizeToBigInt('123.333333333000G')).toEqual([123333333333n, false])
    expect(parseHumanByteSizeToBigInt('123.3 G')).toEqual([123300000000n, false])

    expect(parseHumanByteSizeToBigInt('123')).toEqual([123n, false])
    expect(parseHumanByteSizeToBigInt('123Ki')).toEqual([125952n, false])
    expect(parseHumanByteSizeToBigInt('123.3Ki')).toEqual([126259n, true])
    expect(parseHumanByteSizeToBigInt('123.0Ki')).toEqual([125952n, false])
    expect(parseHumanByteSizeToBigInt('123.333Ki')).toEqual([126293n, true])
    expect(parseHumanByteSizeToBigInt('123.33355Ki')).toEqual([126294n, true])
    expect(parseHumanByteSizeToBigInt('123.333000Ki')).toEqual([126293n, true])
    expect(parseHumanByteSizeToBigInt('123Mi')).toEqual([128974848n, false])
    expect(parseHumanByteSizeToBigInt('123.3Mi')).toEqual([129289421n, true])
    expect(parseHumanByteSizeToBigInt('123.333333Mi')).toEqual([129324373n, true])
    expect(parseHumanByteSizeToBigInt('123.333333000Mi')).toEqual([129324373n, true])
    expect(parseHumanByteSizeToBigInt('123Gi')).toEqual([132070244352n, false])
    expect(parseHumanByteSizeToBigInt('123.3Gi')).toEqual([132392366899n, true])
    expect(parseHumanByteSizeToBigInt('123.333333333Gi')).toEqual([132428158293n, true])
    expect(parseHumanByteSizeToBigInt('123.333333333000Gi')).toEqual([132428158293n, true])
    expect(parseHumanByteSizeToBigInt('123.3 Gi')).toEqual([132392366899n, true])
})

test('Should not parse human byte size to bigint', () => {
    expect(() => parseHumanByteSizeToBigInt('dfg')).toThrowError()
    expect(() => parseHumanByteSizeToBigInt('123m')).toThrowError()
    expect(() => parseHumanByteSizeToBigInt(' 123 ')).toThrowError()
})
