import { BigDecimal } from '@/model/evitadb'

/**
 * Represents query execution result object.
 */
export type Result = {
    [key: string]: any
}

/**
 * What is supported to visualise.
 */
export enum VisualiserTypeType {
    FacetSummary = 'facet-summary',
    Hierarchy = 'hierarchy',
    AttributeHistograms = 'attribute-histograms',
    PriceHistogram = 'price-histogram'
}

/**
 * Descriptor of what is supported to visualise.
 */
export type VisualiserType = {
    title: string
    value: VisualiserTypeType
}

/**
 * Facet group statistics DTO ready for visualisation
 */
export type VisualisedFacetGroupStatistics = {
    primaryKey?: number
    title?: string
    count?: number
}

/**
 * Facet statistics DTO ready for visualisation
 */
export type VisualisedFacetStatistics = {
    requested?: boolean
    primaryKey?: number
    title?: string
    numberOfEntities?: number
    impactDifference?: string
    impactMatchCount?: number
    count?: number
}

/**
 * Named hierarchy DTO ready for visualisation
 */
export type VisualisedNamedHierarchy = {
    count?: number
    trees: VisualisedHierarchyTreeNode[]
    requestedNode?: VisualisedHierarchyTreeNode
}

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

/**
 * Single returned histogram DTO ready for visualisation.
 */
export class VisualisedHistogram {
    readonly min?: BigDecimal
    readonly max?: BigDecimal
    readonly overallCount?: number
    readonly buckets: VisualisedHistogramBucket[]

    constructor(min: BigDecimal | undefined,
                max: BigDecimal | undefined,
                overallCount: number | undefined,
                buckets: VisualisedHistogramBucket[]) {
        this.min = min
        this.max = max
        this.overallCount = overallCount
        this.buckets = buckets
    }

    static fromJson(json: any): VisualisedHistogram {
        const buckets = json.buckets.map((bucket: any) => VisualisedHistogramBucket.fromJson(bucket))
        return new VisualisedHistogram(json.min, json.max, json.overallCount, buckets)
    }
}

/**
 * Single histogram bucket DTO ready for visualisation.
 */
export class VisualisedHistogramBucket {
    readonly threshold?: BigDecimal
    readonly occurrences?: number
    readonly requested?: boolean

    constructor(threshold: BigDecimal | undefined,
                occurrences: number | undefined,
                requested: boolean | undefined) {
        this.threshold = threshold
        this.occurrences = occurrences
        this.requested = requested
    }

    static fromJson(json: any): VisualisedHistogramBucket {
        return new VisualisedHistogramBucket(json.threshold, json.occurrences, json.requested)
    }
}
