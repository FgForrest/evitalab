/**
 * Quality of a match of a query against a symbol name, lower is better. Used to order results inside one
 * symbol type.
 */
export enum MatchTier {
    /** the whole name equals the query */
    Exact = 0,
    /** the name starts with the query */
    Prefix = 1,
    /** the query is found at the start of a word of the name */
    WordStart = 2,
    /** the query is a chain of prefixes of consecutive words */
    WordPrefixChain = 3,
    /** the query is a chain of prefixes of words, some words in between are skipped */
    WordPrefixChainWithSkips = 4,
    /** the query is found inside a word */
    Substring = 5
}
