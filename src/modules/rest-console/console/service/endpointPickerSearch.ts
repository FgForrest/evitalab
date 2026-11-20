/**
 * Splits the endpoint picker's search text into lower-case terms. The search field is clearable, and Vuetify sets
 * a cleared field to `null`, so a missing text simply means no terms.
 */
export function splitEndpointSearchTerms(search: string | null | undefined): string[] {
    return (search ?? '').trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
}

/**
 * Whether every term occurs in one of the searchable texts of an endpoint (group, display name, operation ids,
 * paths). No terms match everything.
 */
export function matchesEndpointSearchTerms(searchableTexts: readonly (string | undefined)[], terms: readonly string[]): boolean {
    if (terms.length === 0) {
        return true
    }
    const haystack: string = searchableTexts
        .filter(text => text != undefined)
        .join(' ')
        .toLowerCase()
    return terms.every(term => haystack.includes(term))
}
