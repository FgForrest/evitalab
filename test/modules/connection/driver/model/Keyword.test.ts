import { test, expect } from 'vitest'
import { Keyword } from '../../../../../src/modules/connection/driver/grpc/model/Keyword'

/**
 * Tests for evitaDB keywords
 */

test('Should correctly compare keywords', () => {
    expect(new Keyword(['a']))
        .toSatisfy((it: Keyword) => new Keyword(['a']).equals(it))
    expect(new Keyword(['a', 'b']))
        .toSatisfy((it: Keyword) => new Keyword(['a', 'b']).equals(it))

    expect(new Keyword(['a', 'b']))
        .not
        .toSatisfy((it: Keyword) => new Keyword(['b', 'a']).equals(it))
    expect(new Keyword(['a', 'c']))
        .not
        .toSatisfy((it: Keyword) => new Keyword(['a', 'b']).equals(it))
    expect(new Keyword(['a', 'b']))
        .not
        .toSatisfy((it: Keyword) => new Keyword(['a']).equals(it))
})
