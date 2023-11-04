import {
    FacetSummaryVisualiserService,
    HierarchyVisualiserService
} from '@/services/editor/result-visualiser/result-visualiser.service'
import { Result, VisualisedHierarchyTreeNode, VisualisedNamedHierarchy } from '@/model/editor/result-visualiser'
import { CatalogSchema, EntitySchema } from '@/model/evitadb'
import { EvitaDBConnection, UnexpectedError } from '@/model/lab'
import {  LabService } from '@/services/lab.service'
import { inject, InjectionKey } from 'vue'
import {
    JsonFacetSummaryVisualiserService, JsonHierarchyVisualiserService,
    JsonResultVisualiserService
} from '@/services/editor/result-visualiser/json-result-visualiser.service'

export const key: InjectionKey<EvitaQLResultVisualiserService> = Symbol()

const collectionConstraintPattern: RegExp = /collection\(\s*'([A-Za-z0-9_.\-~]*)'\s*\)/

/**
 * {@link ResultVisualiserService} for evitaQL query language.
 */
export class EvitaQLResultVisualiserService extends JsonResultVisualiserService {
    private readonly labService: LabService
    private facetSummaryVisualiserService: EvitaQLFacetSummaryVisualiserService | undefined = undefined
    private hierarchyVisualiserService: EvitaQLHierarchyVisualiserService | undefined = undefined

    constructor(labService: LabService) {
        super()
        this.labService = labService
    }

    supportsMultipleQueries(): boolean {
        return false
    }

    findQueries(inputQuery: string, result: Result): string[] {
        const entityType: string | undefined = collectionConstraintPattern.exec(inputQuery)?.[1]
        if (entityType == undefined) {
            throw new UnexpectedError(undefined, `Entity type not found in query.`)
        }
        return [entityType]
    }

    findQueryResult(result: Result, query: string): Result | undefined {
        return result
    }

    async getEntitySchemaForQuery(query: string, connection: EvitaDBConnection, catalogName: string): Promise<EntitySchema> {
        const entityType: string = query
        const catalogSchema: CatalogSchema = await this.labService.getCatalogSchema(connection, catalogName)
        const entitySchema: EntitySchema | undefined = Object.values(catalogSchema.entitySchemas)
            .find(it => it.nameVariants.pascalCase === entityType)
        if (entitySchema == undefined) {
            throw new UnexpectedError(connection, `Entity schema '${entityType}' not found in catalog '${catalogName}'.`)
        }
        return entitySchema
    }

    resolveRepresentativeTitleForEntityResult(entityResult: Result | undefined, representativeAttributes: string[]): string | undefined {
        if (!entityResult) {
            return undefined
        }

        const actualRepresentativeAttributes: (string | undefined)[] = []

        const globalAttributes: Result = entityResult['attributes']?.['global'] || {}
        for (const attributeName in globalAttributes) {
            if (!representativeAttributes.includes(attributeName)) {
                continue;
            }
            actualRepresentativeAttributes.push(this.toPrintableAttributeValue(globalAttributes[attributeName]))
        }

        const localizedAttributes: Result = entityResult['attributes']?.['localized'] || {}
        const localizedAttributesLocales: string[] = Object.keys(localizedAttributes)
        if (localizedAttributesLocales.length > 0) {
            // todo lho there can be legitimately more locales, we need to look for the entityLocaleEquals if there are multiple locales
            const locale: string = localizedAttributesLocales[0]
            const attributesInLocale: Result = localizedAttributes[locale]
            for (const attributeName in attributesInLocale) {
                if (!representativeAttributes.includes(attributeName)) {
                    continue;
                }
                actualRepresentativeAttributes.push(this.toPrintableAttributeValue(attributesInLocale[attributeName]))
            }
        }

        if (actualRepresentativeAttributes.length === 0) {
            return undefined
        }
        return actualRepresentativeAttributes.filter(it => it != undefined).join(', ')
    }

    getFacetSummaryService(): FacetSummaryVisualiserService {
        if (!this.facetSummaryVisualiserService) {
            this.facetSummaryVisualiserService = new EvitaQLFacetSummaryVisualiserService(this)
        }
        return this.facetSummaryVisualiserService
    }

    getHierarchyService(): HierarchyVisualiserService {
        if (!this.hierarchyVisualiserService) {
            this.hierarchyVisualiserService = new EvitaQLHierarchyVisualiserService(this)
        }
        return this.hierarchyVisualiserService
    }
}

/**
 * {@link FacetSummaryVisualiserService} for GraphQL query language.
 */
export class EvitaQLFacetSummaryVisualiserService extends JsonFacetSummaryVisualiserService<EvitaQLResultVisualiserService> {
    constructor(visualiserService: EvitaQLResultVisualiserService) {
        super(visualiserService)
    }
}

/**
 * {@link HierarchyVisualiserService} for GraphQL query language.
 */
export class EvitaQLHierarchyVisualiserService extends JsonHierarchyVisualiserService<EvitaQLResultVisualiserService> {

    constructor(visualiserService: EvitaQLResultVisualiserService) {
        super(visualiserService)
    }

    resolveNamedHierarchy(namedHierarchyResult: Result[], entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy {
        const trees: VisualisedHierarchyTreeNode[] = []
        const nodeCountHolder: HierarchyTreeNodeCountHolder = { count: 0 }
        const requestedNodeHolder: RequestedHierarchyTreeNodeHolder = { requestedNode: undefined }

        for (const treeResult of namedHierarchyResult) {
            const tree: VisualisedHierarchyTreeNode = this.resolveHierarchyTreeNode(
                treeResult,
                1,
                nodeCountHolder,
                requestedNodeHolder,
                entityRepresentativeAttributes
            )
            trees.push(tree)
        }

        return { count: nodeCountHolder.count, trees, requestedNode: requestedNodeHolder.requestedNode }
    }

    private resolveHierarchyTreeNode(nodeResult: Result,
                                     level: number,
                                     nodeCountHolder: HierarchyTreeNodeCountHolder,
                                     requestedNodeHolder: RequestedHierarchyTreeNodeHolder,
                                     entityRepresentativeAttributes: string[]): VisualisedHierarchyTreeNode {
        nodeCountHolder.count++

        const nodeEntity: Result | undefined = nodeResult['entity']

        const primaryKey: number | undefined = nodeEntity?.['primaryKey']
        // only root nodes should display parents, we know parents in nested nodes from the direct parent in the tree
        const parentPrimaryKey: number | undefined = level === 1 ? nodeEntity?.['parentPrimaryKey'] : undefined
        const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
            nodeEntity,
            entityRepresentativeAttributes
        )
        const requested: boolean | undefined = nodeResult['requested']
        const childrenCount: number | undefined = nodeResult['childrenCount']
        const queriedEntityCount: number | undefined = nodeResult['queriedEntityCount']

        const children: VisualisedHierarchyTreeNode[] = []
        const childResults: Result[] | undefined = nodeResult['children']
        if (childResults && childResults.length > 0) {
            for (const childResult of childResults) {
                const childNode: VisualisedHierarchyTreeNode = this.resolveHierarchyTreeNode(
                    childResult,
                    level + 1,
                    nodeCountHolder,
                    requestedNodeHolder,
                    entityRepresentativeAttributes
                )
                children.push(childNode)
            }
        }

        const node: VisualisedHierarchyTreeNode = new VisualisedHierarchyTreeNode(
            primaryKey,
            parentPrimaryKey,
            title,
            requested,
            childrenCount,
            queriedEntityCount,
            children
        )
        if (requested) {
            requestedNodeHolder.requestedNode = node
        }

        return node
    }
}

type HierarchyTreeNodeCountHolder = {
    count: number
}

type RequestedHierarchyTreeNodeHolder = {
    requestedNode: VisualisedHierarchyTreeNode | undefined
}

export const useEvitaQLResultVisualiserService = (): EvitaQLResultVisualiserService => {
    return inject(key) as EvitaQLResultVisualiserService
}
