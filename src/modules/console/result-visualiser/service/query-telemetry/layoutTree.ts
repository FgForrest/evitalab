/**
 * Direction the tree grows in: top-down (`TB`, depth = row) or left-to-right (`LR`, depth = column).
 */
export type TreeLayoutOrientation = 'TB' | 'LR'

/**
 * Inputs of {@link layoutTree}. Every node gets the same fixed size, so positions are known before anything renders.
 */
export interface TreeLayoutOptions<T> {
    readonly orientation: TreeLayoutOrientation
    /**
     * Card width in px.
     */
    readonly w: number
    /**
     * Card height in px.
     */
    readonly h: number
    /**
     * Gap between depth levels (between rows for `TB`, columns for `LR`).
     */
    readonly gapMain: number
    /**
     * Gap between neighbouring leaves on the cross axis.
     */
    readonly gapCross: number
    readonly children: (node: T) => Iterable<T>
    /**
     * Key of a node that back-references may point to; required for {@link refTarget} resolution.
     */
    readonly nodeId?: (node: T) => string | undefined
    /**
     * Whether the node is only a pointer to a node placed elsewhere. Such a node is not placed; an extra edge from its
     * parent to the target is emitted instead.
     */
    readonly isRef?: (node: T) => boolean
    /**
     * Key ({@link nodeId}) of the node a back-reference points to.
     */
    readonly refTarget?: (node: T) => string | undefined
}

/**
 * A placed node; `x`/`y` is the top-left corner in px.
 */
export interface LaidOutNode<T> {
    readonly node: T
    readonly depth: number
    readonly x: number
    readonly y: number
    readonly w: number
    readonly h: number
}

/**
 * A parent-child edge, or (`ref: true`) a back-reference edge from the pointer's parent to the canonical node.
 */
export interface LaidOutEdge<T> {
    readonly from: LaidOutNode<T>
    readonly to: LaidOutNode<T>
    readonly ref: boolean
}

/**
 * Result of {@link layoutTree}: placed nodes in pre-order, edges and the bounding size.
 */
export interface TreeLayout<T> {
    readonly orientation: TreeLayoutOrientation
    readonly nodes: readonly LaidOutNode<T>[]
    readonly edges: readonly LaidOutEdge<T>[]
    readonly width: number
    readonly height: number
}

/**
 * Lays out a tree with fixed-size cards: a pre-order pass stacks the leaves one after another along the cross axis,
 * every parent is centred on its first and last child, and depth maps to the main axis. Back-references (`isRef`) are
 * not placed but resolved, after the pass, to edges pointing at the canonical node, which turns a tree with a handful
 * of shared nodes into a valid DAG drawing. A back-reference whose target is unknown is dropped.
 */
export function layoutTree<T>(root: T, options: TreeLayoutOptions<T>): TreeLayout<T> {
    const { orientation, w, h, gapMain, gapCross } = options
    const mainStep: number = (orientation === 'LR' ? w : h) + gapMain
    const crossStep: number = (orientation === 'LR' ? h : w) + gapCross

    type MutableNode = { node: T, depth: number, main: number, cross: number }
    const placed: MutableNode[] = []
    const byId: Map<string, MutableNode> = new Map()
    const treeEdges: [MutableNode, MutableNode][] = []
    const refEdges: [MutableNode, string][] = []
    let nextCross: number = 0

    const place = (node: T, depth: number): MutableNode => {
        const me: MutableNode = { node, depth, main: depth * mainStep, cross: 0 }
        placed.push(me)
        const id: string | undefined = options.nodeId?.(node)
        if (id != undefined) {
            byId.set(id, me)
        }
        const children: MutableNode[] = []
        for (const child of options.children(node)) {
            if (options.isRef?.(child) === true) {
                const target: string | undefined = options.refTarget?.(child)
                if (target != undefined) {
                    refEdges.push([me, target])
                }
                continue
            }
            children.push(place(child, depth + 1))
        }
        const first: MutableNode | undefined = children[0]
        const last: MutableNode | undefined = children[children.length - 1]
        if (first != undefined && last != undefined) {
            me.cross = (first.cross + last.cross) / 2
            children.forEach(child => treeEdges.push([me, child]))
        } else {
            me.cross = nextCross
            nextCross += crossStep
        }
        return me
    }
    place(root, 0)

    const finished: Map<MutableNode, LaidOutNode<T>> = new Map(placed.map(it => [it, {
        node: it.node,
        depth: it.depth,
        x: orientation === 'LR' ? it.main : it.cross,
        y: orientation === 'LR' ? it.cross : it.main,
        w,
        h
    }]))
    const edges: LaidOutEdge<T>[] = []
    const addEdge = (from: MutableNode, to: MutableNode | undefined, ref: boolean): void => {
        const fromNode: LaidOutNode<T> | undefined = finished.get(from)
        const toNode: LaidOutNode<T> | undefined = to == undefined ? undefined : finished.get(to)
        if (fromNode != undefined && toNode != undefined) {
            edges.push({ from: fromNode, to: toNode, ref })
        }
    }
    treeEdges.forEach(([from, to]) => addEdge(from, to, false))
    refEdges.forEach(([from, targetId]) => addEdge(from, byId.get(targetId), true))

    const nodes: LaidOutNode<T>[] = Array.from(finished.values())
    return {
        orientation,
        nodes,
        edges,
        width: Math.max(0, ...nodes.map(it => it.x + it.w)),
        height: Math.max(0, ...nodes.map(it => it.y + it.h))
    }
}

/**
 * Inputs of {@link layoutGrid}.
 */
export interface GridLayoutOptions {
    /**
     * Card width in px.
     */
    readonly w: number
    /**
     * Card height in px.
     */
    readonly h: number
    /**
     * Gap between neighbouring cards in both directions.
     */
    readonly gap: number
}

/**
 * Lays out unrelated nodes as a grid of fixed-size cards, row by row in the given order, without edges. The column
 * count is chosen so that the grid is roughly square. Produces a {@link TreeLayout} so that it can be drawn by the
 * same canvas as the trees (with the `TB` orientation).
 */
export function layoutGrid<T>(nodes: readonly T[], options: GridLayoutOptions): TreeLayout<T> {
    const { w, h, gap } = options
    const columns: number = Math.max(1, Math.ceil(Math.sqrt(nodes.length * (h + gap) / (w + gap))))
    const laidOut: LaidOutNode<T>[] = nodes.map((node, index) => ({
        node,
        depth: 0,
        x: (index % columns) * (w + gap),
        y: Math.floor(index / columns) * (h + gap),
        w,
        h
    }))
    return {
        orientation: 'TB',
        nodes: laidOut,
        edges: [],
        width: Math.max(0, ...laidOut.map(it => it.x + it.w)),
        height: Math.max(0, ...laidOut.map(it => it.y + it.h))
    }
}
