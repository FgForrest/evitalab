import { inject, InjectionKey } from 'vue'

import { InitializationError } from '@/modules/base/exception/InitializationError'

/**
 * Wrapper around inject that throws an error if the key is not provided.
 * @param key
 * @param defaultValue
 */
export function mandatoryInject<T>(key: InjectionKey<T>, defaultValue?: T) {
    const resolved: T | undefined = inject(key, defaultValue);
    if (resolved == undefined) {
        throw new InitializationError(`${key.description} was not provided.`);
    }
    return resolved;
}
