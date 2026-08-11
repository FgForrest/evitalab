/**
 * Default width of the connection explorer panel in pixels. Used when nothing has been persisted yet, and
 * when the user resets the width by double-clicking the resizer.
 */
export const defaultPanelWidth: number = 325

/**
 * Smallest width the connection explorer panel may be dragged to, in pixels. Below this the tree items stop
 * being readable - the header itself survives narrower, it truncates its title.
 */
export const minPanelWidth: number = 200

/**
 * Space in pixels that must be left for the rest of the workspace, whatever the panel width is. It includes
 * the workspace rail, which exists only in the standalone run mode, so that the maximum panel width stays a
 * pure function of the viewport width in both run modes.
 */
const minContentWidth: number = 460

/**
 * Largest width the connection explorer panel may take on the given viewport, in pixels. A width persisted on
 * a wide monitor must not swallow a narrow viewport.
 */
export function maxPanelWidth(viewportWidth: number): number {
    if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
        // no usable viewport information, the minimum is the only limit we can honour
        return Number.POSITIVE_INFINITY
    }
    return Math.min(0.5 * viewportWidth, viewportWidth - minContentWidth)
}

/**
 * Normalizes a width of unknown origin (persisted by an older build, corrupted, hand-edited) into a usable
 * number of pixels. Does not take the viewport into account, see {@link clampPanelWidth} for that.
 */
export function sanitizePanelWidth(width: unknown): number {
    if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) {
        return defaultPanelWidth
    }
    return Math.round(width)
}

/**
 * Fits a panel width into the range the given viewport allows. When the viewport is so narrow that the maximum
 * falls below the minimum, the minimum wins - a panel too narrow to use would be worse than a cramped
 * workspace.
 */
export function clampPanelWidth(width: number, viewportWidth: number): number {
    const sanitizedWidth: number = sanitizePanelWidth(width)
    return Math.max(minPanelWidth, Math.min(sanitizedWidth, maxPanelWidth(viewportWidth)))
}
