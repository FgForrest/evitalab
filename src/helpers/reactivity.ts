import { inject, InjectionKey } from 'vue'
import { UnexpectedError } from '@/model/lab'

/**
 * Wrapper around inject that throws an error if the key is not provided.
 * @param key
 * @param defaultValue
 */
export function mandatoryInject<T>(key: InjectionKey<T>, defaultValue?: T) {
    const resolved = inject(key, defaultValue);
    if (resolved == undefined) {
        throw new UnexpectedError(undefined, `${key.description} was not provided.`);
    }
    return resolved;
}
