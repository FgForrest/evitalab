import type { List as ImmutableList } from 'immutable'
import {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'

/**
 * Named hierarchy DTO ready for visualisation
 */
export class VisualisedNamedHierarchy {
    readonly count?: number
    readonly trees: ImmutableList<VisualisedHierarchyTreeNode>
    readonly requestedNode?: VisualisedHierarchyTreeNode

    constructor( trees: ImmutableList<VisualisedHierarchyTreeNode>, count?: number, requestedNode?: VisualisedHierarchyTreeNode){
        this.count = count
        this.trees = trees
        this.requestedNode = requestedNode
    }
}
