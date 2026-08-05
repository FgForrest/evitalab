import { beforeEach, expect, test } from 'vitest'
import { LabStorage } from '@/modules/storage/LabStorage'

/**
 * Tests for the lab storage
 */

let storage: LabStorage

beforeEach(() => {
    storage = new LabStorage('http://localhost:5555')
    storage.remove('someKey')
})

test('Should return default value only for missing values', () => {
    expect(storage.get('someKey', 'defaultValue')).toEqual('defaultValue')
    expect(storage.get('someKey')).toBeUndefined()

    storage.set('someKey', 'someValue')
    expect(storage.get('someKey', 'defaultValue')).toEqual('someValue')
})

test('Should return falsy values as they were stored', () => {
    // the selected tab index of the first tab is zero and must not fall back to the default value
    storage.set('someKey', 0)
    expect(storage.get('someKey', -1)).toEqual(0)

    storage.set('someKey', '')
    expect(storage.get('someKey', 'defaultValue')).toEqual('')

    storage.set('someKey', false)
    expect(storage.get('someKey', true)).toEqual(false)
})
