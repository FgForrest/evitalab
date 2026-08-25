import { describe, expect, test } from 'vitest'
import {
    MetadataItem,
    MetadataItemSeverity
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation'

/**
 * Captures of the infrastructure area reach the operation item as well - they used to be rendered through the entity
 * type item, which labelled a transaction as an entity type and reported it as a successful data change.
 */
describe('MetadataItem.operation', () => {
    test('a data change is reported by its outcome', () => {
        expect(MetadataItem.operation(Operation.Upsert).severity).toBe(MetadataItemSeverity.Success)
        expect(MetadataItem.operation(Operation.Remove).severity).toBe(MetadataItemSeverity.Error)
    })

    test('a transaction is neither a success nor a failure', () => {
        const item: MetadataItem = MetadataItem.operation(Operation.Transaction)

        expect(item.severity).toBe(MetadataItemSeverity.Info)
        expect(item.icon).toBe('mdi-source-commit')
        expect(item.value).toBe('transaction')
    })

    test('an operation of a newer server is rendered as unknown', () => {
        const item: MetadataItem = MetadataItem.operation(Operation.Unknown)

        expect(item.severity).toBe(MetadataItemSeverity.Info)
        expect(item.icon).toBe('mdi-help')
    })

    test('a missing operation renders an empty value', () => {
        expect(MetadataItem.operation(undefined).value).toBe('')
    })
})
