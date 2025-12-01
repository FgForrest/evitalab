import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { List as ImmutableList } from 'immutable'
import type {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import { ContainerType } from '@/modules/database-driver/data-type/ContainerType.ts'

/**
 * Generic context for mutation history visualisation
 */
export class MutationHistoryVisualisationContext {

    readonly catalogName: string
    readonly historyCriteria: MutationHistoryCriteria;

    private readonly rootVisualisedRecords: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private readonly visualisedSessionRecordsIndex: Map<string, MutationHistoryItemVisualisationDefinition> = new Map()
    private readonly pendingChildrenIndex: Map<string, MutationHistoryItemVisualisationDefinition[]> = new Map()

    constructor(catalogName: string, historyCriteria: MutationHistoryCriteria) {
        this.catalogName = catalogName
        this.historyCriteria = historyCriteria
    }

    getVisualisedRecords(): ImmutableList<MutationHistoryItemVisualisationDefinition> {

        const entityTypes = CatalogSchemaConverter.toContainerTypes(this.historyCriteria.containerTypeList)


        if (entityTypes.contains(ContainerType.ENTITY)) {
        const filtered = Array.from(this.rootVisualisedRecords.values());

        return ImmutableList(filtered)
        } else if ([ContainerType.PRICE, ContainerType.REFERENCE, ContainerType.ASSOCIATED_DATA, ContainerType.ATTRIBUTE].some(type => entityTypes.includes(type))) {
            const filtered = Array.from(this.rootVisualisedRecords.values())
                .filter(v => v.children.size > 0);

            const v = filtered.flatMap(v => Array.from(v.children));

            return ImmutableList(v);
        } else {
            const filtered = Array.from(this.rootVisualisedRecords.values())
                .filter(v => v.children.size > 0);

            return ImmutableList(filtered)
        }
    }

    // todo pfi: consultation required
    addRootVisualisedRecord(record: MutationHistoryItemVisualisationDefinition): void {
        if (this.rootVisualisedRecords.has(record.source.version.toString())) {
            // throw new UnexpectedError(`There is already mutation history record with transaction ID '${sessionId.toString()}'`)
        } else {
            this.rootVisualisedRecords.set(record.source.version.toString(), record)
        }

    }

    getVisualisedSessionRecord(sessionId: number): MutationHistoryItemVisualisationDefinition | undefined {
        return this.visualisedSessionRecordsIndex.get(sessionId.toString())
    }

    addVisualisedSessionRecord(sessionId: number, record: MutationHistoryItemVisualisationDefinition): void {
        if (this.visualisedSessionRecordsIndex.has(sessionId.toString())) {
            // throw new UnexpectedError(`There is already mutation history record with transaction ID '${sessionId.toString()}'`)
        } else {
            this.visualisedSessionRecordsIndex.set(sessionId.toString(), record)
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
