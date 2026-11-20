/**
 * Index of the highlighted row of the endpoint picker after an arrow key: it moves by one and stops at both ends
 * rather than wrapping, so holding a key never jumps across the list. An empty list has no highlight (`-1`).
 */
export function moveEndpointHighlight(currentIndex: number, direction: 'up' | 'down', rowCount: number): number {
    if (rowCount === 0) {
        return -1
    }
    const next: number = direction === 'down' ? currentIndex + 1 : currentIndex - 1
    return Math.min(Math.max(next, 0), rowCount - 1)
}
