import XXH, { HashObject } from 'xxhashjs'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

const hasher: HashObject = XXH.h64()

/**
 * Represents a single comparable classifier keyword in evitaDB.
 */
export class Keyword {
    readonly hash: number

    constructor(words: string[]) {
        if (words.length === 0) {
            throw new UnexpectedError('Keyword cannot be empty.')
        }
        let hashBuilder: HashObject = hasher
        for (const word of words) {
            hashBuilder = hashBuilder.update(word)
        }
        this.hash = hashBuilder.digest().toNumber()
    }

    equals(other: Keyword): boolean {
        return this.hash === other.hash
    }
}
