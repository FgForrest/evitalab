import {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'

/**
 * Named hierarchy DTO ready for visualisation
 */
export class VisualisedNamedHierarchy {
    readonly count?: number
    readonly trees: VisualisedHierarchyTreeNode[]
    readonly requestedNode?: VisualisedHierarchyTreeNode

    constructor( trees: VisualisedHierarchyTreeNode[], count?: number, requestedNode?: VisualisedHierarchyTreeNode){
        this.count = count
        this.trees = trees
        this.requestedNode = requestedNode
    }
}
