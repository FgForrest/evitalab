/**
 * Shape the entity primary key filter accepts. evitaDB primary keys are whole numbers, so anything else typed into
 * the filter input is rejected.
 */
export const entityPrimaryKeyPattern: RegExp = /^\d+$/

/**
 * Parses the raw entity primary key filter input into a number. An empty or malformed input yields undefined, i.e. no
 * filtering by primary key at all. A malformed input is reported to the user by the input validation rule, this parser
 * only makes sure a non-number never reaches the criteria, which are typed (and sent to the server) as a number.
 */
export function parseEntityPrimaryKeyFilter(rawValue: string | undefined): number | undefined {
    const normalizedValue: string = (rawValue ?? '').trim()
    if (!entityPrimaryKeyPattern.test(normalizedValue)) {
        return undefined
    }
    return Number(normalizedValue)
}

/**
 * Whether the raw entity primary key filter input is acceptable. An empty input is valid, it simply means no filtering.
 */
export function isEntityPrimaryKeyFilterValid(rawValue: string | undefined): boolean {
    const normalizedValue: string = (rawValue ?? '').trim()
    return normalizedValue === '' || entityPrimaryKeyPattern.test(normalizedValue)
}
