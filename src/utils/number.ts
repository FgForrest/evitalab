export function round(n: number, decimalPlaces: number): number {
    const multiplier: number = Math.pow(10, decimalPlaces)
    return Math.round(n * multiplier) / multiplier
}
