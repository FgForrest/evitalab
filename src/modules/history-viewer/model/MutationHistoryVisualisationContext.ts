import { List as ImmutableList } from 'immutable'
import type {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import { ContainerType } from '@/modules/database-driver/data-type/ContainerType.ts'
import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceMutation.ts'
import type { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'

/**
 * Generic context for mutation history visualisation
 */
export class MutationHistoryVisualisationContext {

    readonly catalogName: string
    readonly historyCriteria: MutationHistoryCriteria

    private readonly rootVisualisedRecords: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private readonly visualisedSessionRecordsIndex: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private readonly pendingChildrenIndex: Map<string, MutationHistoryItemVisualisationDefinition[]> = new Map()

    constructor(catalogName: string, historyCriteria: MutationHistoryCriteria) {
        this.catalogName = catalogName
        this.historyCriteria = historyCriteria
    }

    getVisualisedRecords(): ImmutableList<MutationHistoryItemVisualisationDefinition> {

        const entityTypes = CatalogSchemaConverter.toContainerTypes(this.historyCriteria.containerTypeList)


        if (entityTypes.contains(ContainerType.Entity)) {
            const filtered = Array.from(this.rootVisualisedRecords.values())

            return ImmutableList(filtered)
        } else if (!this.historyCriteria.mutableFilters && [ContainerType.Price, ContainerType.Reference, ContainerType.AssociatedData, ContainerType.Attribute].some(type => entityTypes.includes(type))) {
            const filtered = Array.from(this.rootVisualisedRecords.values());
                // .filter(v => v.children.size > 0)

            // const v = filtered.flatMap(v => Array.from(v.children))

            return ImmutableList(filtered)
        } else {
            const filtered = Array.from(this.rootVisualisedRecords.values())
                .filter(v => v.children.size > 0)

            return ImmutableList(filtered)
        }
    }

    /**
     * Registers a top-level record. The first record wins, later records with the same identity are dropped as
     * duplicates — the same catalog version is reported by more than one capture within a single transaction.
     *
     * @return the record actually held under the identity, i.e. the incumbent when the passed one is dropped; a
     * caller that keeps building on its record would otherwise fill in a record that is never rendered
     */
    addRootVisualisedRecord(record: MutationHistoryItemVisualisationDefinition): MutationHistoryItemVisualisationDefinition {
        const key: string = MutationHistoryVisualisationContext.rootVisualisedRecordKey(record)
        const alreadyVisualisedRecord: MutationHistoryItemVisualisationDefinition | undefined =
            this.rootVisualisedRecords.get(key)
        if (alreadyVisualisedRecord != undefined) {
            return alreadyVisualisedRecord
        }
        this.rootVisualisedRecords.set(key, record)
        return record
    }

    /**
     * Identity of a top-level record: the catalog version, narrowed by the affected reference for reference
     * mutations, because a single version may carry several references of the same entity, each visualised
     * as its own record.
     */
    private static rootVisualisedRecordKey(record: MutationHistoryItemVisualisationDefinition): string {
        const version: string = record.source.version.toString()
        if (record.source.body instanceof ReferenceMutation) {
            const referenceKey: ReferenceKey = record.source.body.referenceKey
            return `${version}/${referenceKey.primaryKey}/${referenceKey.referenceName}`
        }
        return version
    }

    getVisualisedSessionRecord(sessionId: number): MutationHistoryItemVisualisationDefinition | undefined {
        return this.visualisedSessionRecordsIndex.get(sessionId.toString())
    }

    /**
     * Registers the record all other captures of the given catalog version nest under. First-wins, like
     * {@link addRootVisualisedRecord}, because more than one capture of a version may be visualisable as its
     * top-level record.
     */
    addVisualisedSessionRecord(sessionId: number, record: MutationHistoryItemVisualisationDefinition): void {
        const key: string = sessionId.toString()
        if (!this.visualisedSessionRecordsIndex.has(key)) {
            this.visualisedSessionRecordsIndex.set(key, record)
        }
    }

    addPendingChild(transactionId: number, record: MutationHistoryItemVisualisationDefinition): void {
        const key = transactionId.toString()
        const arr = this.pendingChildrenIndex.get(key) || []
        arr.push(record)
        this.pendingChildrenIndex.set(key, arr)
    }

    attachPendingChildren(transactionId: number, transactionRecord: MutationHistoryItemVisualisationDefinition): void {
        const key = transactionId.toString()
        const arr = this.pendingChildrenIndex.get(key)
        if (arr && arr.length > 0) {
            for (const child of arr) {
                transactionRecord.addChild(child)
            }
            this.pendingChildrenIndex.delete(key)
        }
    }

}
