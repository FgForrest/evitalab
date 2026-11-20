import { List as ImmutableList } from 'immutable'
import type { HierarchyResultParser } from '@/modules/console/result-visualiser/service/HierarchyResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import {
    VisualisedHierarchyResult,
    VisualisedNamedHierarchyEntry,
    VisualisedReferenceHierarchy
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyResult'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import { VisualisedHierarchyTreeNode } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import type { RestResultNode } from '@/modules/rest-console/console/result-visualiser/model/RestResultNode'
import { resolveRestRepresentativeTitle } from '@/modules/rest-console/console/result-visualiser/service/restRepresentativeTitle'

/**
 * Key of the hierarchy of the queried entity itself (`hierarchyOfSelf`).
 */
const selfHierarchyKey: string = 'self'

/**
 * {@link HierarchyResultParser} for the REST API. REST returns
 * `extraResults.hierarchy.<referenceName | self>.<outputName>[]` as a **nested** tree (`children[]`), so the tree is
 * built recursively, children first.
 */
export class RestHierarchyResultParser implements HierarchyResultParser {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: unknown, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedHierarchyResult> {
        const hierarchyResult: RestResultNode | undefined = (queryResult as RestResultNode)['extraResults']?.['hierarchy']
        if (!hierarchyResult) {
            return new VisualisedHierarchyResult([])
        }

        const references: VisualisedReferenceHierarchy[] = []
        for (const referenceName of Object.keys(hierarchyResult)) {
            let referenceSchema: ReferenceSchema | undefined = undefined
            let representativeAttributes: string[]
            if (referenceName === selfHierarchyKey) {
                representativeAttributes = Array.from(entitySchema.attributes.values())
                    .filter(attribute => attribute.representative)
                    .map(attribute => attribute.nameVariants.get(NamingConvention.CamelCase) ?? attribute.name)
            } else {
                referenceSchema = findSchemaByName(
                    referenceName,
                    entitySchema.references.values(),
                    entitySchema.name,
                    'Reference'
                )
                representativeAttributes = referenceSchema.referencedEntityTypeManaged
                    ? await resolveRepresentativeAttributes(this.evitaClient, catalogName, referenceSchema.entityType)
                    : []
            }

            const namedHierarchiesResult: RestResultNode = hierarchyResult[referenceName] ?? {}
            const namedHierarchies: VisualisedNamedHierarchyEntry[] = Object.keys(namedHierarchiesResult)
                .map(outputName => new VisualisedNamedHierarchyEntry(
                    outputName,
                    this.resolveNamedHierarchy(namedHierarchiesResult[outputName] ?? [], representativeAttributes)
                ))
            references.push(new VisualisedReferenceHierarchy(referenceSchema, namedHierarchies))
        }
        return new VisualisedHierarchyResult(references)
    }

    private resolveNamedHierarchy(rootResults: RestResultNode[], representativeAttributes: string[]): VisualisedNamedHierarchy {
        const state: { count: number, requestedNode: VisualisedHierarchyTreeNode | undefined } = {
            count: 0,
            requestedNode: undefined
        }
        const trees: VisualisedHierarchyTreeNode[] = rootResults
            .map(rootResult => this.resolveNode(rootResult, true, representativeAttributes, state))
        return new VisualisedNamedHierarchy(ImmutableList(trees), state.count, state.requestedNode)
    }

    private resolveNode(nodeResult: RestResultNode,
                        root: boolean,
                        representativeAttributes: string[],
                        state: { count: number, requestedNode: VisualisedHierarchyTreeNode | undefined }): VisualisedHierarchyTreeNode {
        state.count++
        const childResults: RestResultNode[] = nodeResult['children'] ?? []
        const children: VisualisedHierarchyTreeNode[] = childResults
            .map(childResult => this.resolveNode(childResult, false, representativeAttributes, state))

        const entityResult: RestResultNode | undefined = nodeResult['entity']
        const parent: unknown = entityResult?.['parent']
        const node: VisualisedHierarchyTreeNode = new VisualisedHierarchyTreeNode(
            entityResult?.['primaryKey'],
            // only a root can point outside of the tree, which is what the parent is displayed for
            root && typeof parent === 'number' ? parent : undefined,
            resolveRestRepresentativeTitle(entityResult, representativeAttributes),
            nodeResult['requested'],
            nodeResult['childrenCount'],
            nodeResult['queriedEntityCount'],
            ImmutableList(children)
        )
        if (nodeResult['requested'] === true) {
            state.requestedNode = node
        }
        return node
    }
}
