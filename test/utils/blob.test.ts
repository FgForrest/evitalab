import { test, expect } from 'vitest'
import { WindowedBlobAccumulator } from '../../src/utils/blob'

function chunk(size: number, fill: number): Uint8Array {
    return new Uint8Array(size).fill(fill)
}

test('Should accumulate all chunks into a single blob', async () => {
    const accumulator: WindowedBlobAccumulator = new WindowedBlobAccumulator(10)
    accumulator.push(chunk(4, 1))
    accumulator.push(chunk(4, 2))
    accumulator.push(chunk(4, 3))

    const blob: Blob = accumulator.finish()

    expect(blob.size).toEqual(12)
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
        new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
    )
})

test('Should wrap chunks into an intermediate blob once the window fills up', () => {
    const accumulator: WindowedBlobAccumulator = new WindowedBlobAccumulator(10)

    accumulator.push(chunk(4, 1))
    expect(accumulator.partCount).toEqual(0)
    accumulator.push(chunk(4, 1))
    expect(accumulator.partCount).toEqual(0)
    // the window is exceeded here and therefore flushed
    accumulator.push(chunk(4, 1))
    expect(accumulator.partCount).toEqual(1)

    accumulator.push(chunk(4, 1))
    expect(accumulator.partCount).toEqual(1)

    // the trailing partial window is flushed by finish()
    expect(accumulator.finish().size).toEqual(16)
    expect(accumulator.partCount).toEqual(2)
})

test('Should produce an empty blob when nothing was pushed', () => {
    expect(new WindowedBlobAccumulator(10).finish().size).toEqual(0)
})

test('Should reject a non-positive window size', () => {
    expect(() => new WindowedBlobAccumulator(0)).toThrow()
})
