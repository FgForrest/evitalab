/**
 * Single hierarchical node of evitaDB hierarchy.
 */
export class VisualisedHierarchyTreeNode {
    readonly primaryKey?: number
    readonly parentPrimaryKey?: number
    readonly title?: string
    readonly requested?: boolean
    readonly childrenCount?: number
    readonly queriedEntityCount?: number
    readonly children: VisualisedHierarchyTreeNode[]

    constructor(primaryKey: number | undefined,
                parentPrimaryKey: number | undefined,
                title: string | undefined,
                requested: boolean | undefined,
                childrenCount: number | undefined,
                queriedEntityCount: number | undefined,
                children: VisualisedHierarchyTreeNode[]) {
        this.primaryKey = primaryKey
        this.parentPrimaryKey = parentPrimaryKey
        this.title = title
        this.requested = requested
        this.childrenCount = childrenCount
        this.queriedEntityCount = queriedEntityCount
        this.children = children
    }

    isLeaf(): boolean {
        return this.children.length === 0
    }
}
