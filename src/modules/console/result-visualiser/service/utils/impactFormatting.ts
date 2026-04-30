/**
 * Formats a numeric impact difference as a signed string (e.g. "+5", "-3", "0").
 */
export function formatImpactDifference(difference: number | undefined): string | undefined {
    if (difference == undefined) return undefined
    return `${difference > 0 ? '+' : ''}${difference}`
}
