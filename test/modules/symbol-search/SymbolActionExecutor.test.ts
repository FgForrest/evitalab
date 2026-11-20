import { describe, expect, test, vi } from 'vitest'

// schema pointers reference their viewer components, which cannot be loaded without a DOM
vi.mock('@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaViewer.vue', () => ({ default: {} }))
vi.mock('@/modules/schema-viewer/viewer/component/catalog/CatalogSchemaViewer.vue', () => ({ default: {} }))
vi.mock('@/modules/schema-viewer/viewer/component/entity/EntitySchemaViewer.vue', () => ({ default: {} }))
vi.mock('@/modules/schema-viewer/viewer/component/reference/ReferenceSchemaViewer.vue', () => ({ default: {} }))
vi.mock('@/modules/schema-viewer/viewer/component/associated-data/AssociatedDataSchemaViewer.vue', () => ({ default: {} }))
vi.mock(
    '@/modules/schema-viewer/viewer/component/sortable-compound/SortableAttributeCompoundSchemaViewer.vue',
    () => ({ default: {} })
)
import { SymbolActionExecutor } from '@/modules/symbol-search/service/SymbolActionExecutor'
import { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import { SymbolPath } from '@/modules/symbol-search/model/SymbolPath'
import { AttributeOwner } from '@/modules/symbol-search/model/AttributeOwner'
import { CatalogSymbolStatus } from '@/modules/symbol-search/model/CatalogSymbolStatus'
import { SymbolActionType } from '@/modules/symbol-search/model/SymbolActionType'
import { SymbolActionDisabledReason } from '@/modules/symbol-search/model/SymbolActionDisabledReason'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { EnabledApis } from '@/modules/symbol-search/model/EnabledApis'
import type { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import type { CatalogViewerTabFactory } from '@/modules/catalog-viewer/service/CatalogViewerTabFactory'
import type { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import type {
    EvitaQLConsoleTabFactory
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import type {
    GraphQLConsoleTabFactory
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import type { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import type { RestConsoleTabFactory } from '@/modules/rest-console/console/workspace/service/RestConsoleTabFactory'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import {
    ReferenceAttributeSchemaPointer
} from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import {
    SortableAttributeCompoundSchemaPointer
} from '@/modules/schema-viewer/viewer/model/SortableAttributeCompoundSchemaPointer'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'

/**
 * Records every tab the executor asks the workspace to open, as `factory:arguments`.
 */
class RecordingWorkspace {
    readonly opened: unknown[][] = []

    readonly executor: SymbolActionExecutor = new SymbolActionExecutor(
        { createTab: (tab: unknown) => this.opened.push(tab as unknown[]) } as unknown as WorkspaceService,
        { createNew: (...args: unknown[]) => ['catalogViewer', ...args] } as unknown as CatalogViewerTabFactory,
        { createNew: (...args: unknown[]) => ['schemaViewer', ...args] } as unknown as SchemaViewerTabFactory,
        { createNew: (...args: unknown[]) => ['evitaQLConsole', ...args] } as unknown as EvitaQLConsoleTabFactory,
        { createNew: (...args: unknown[]) => ['graphQLConsole', ...args] } as unknown as GraphQLConsoleTabFactory,
        { createNew: (...args: unknown[]) => ['entityViewer', ...args] } as unknown as EntityViewerTabFactory,
        { createNew: (...args: unknown[]) => ['restConsole', ...args] } as unknown as RestConsoleTabFactory
    )

    get lastSchemaPointer(): SchemaPointer {
        return this.opened[this.opened.length - 1]?.[1] as SchemaPointer
    }
}

function catalog(state: CatalogState = CatalogState.Alive, unusable: boolean = false): SchemaSymbol {
    return new SchemaSymbol(
        SymbolType.Catalog,
        'evita',
        new SymbolPath('evita'),
        undefined,
        new CatalogSymbolStatus(state, unusable, false)
    )
}

const allApis: EnabledApis = new EnabledApis(true, true)
const noApis: EnabledApis = EnabledApis.none()

const productPath: SymbolPath = new SymbolPath('evita', 'product')
const brandReferencePath: SymbolPath = new SymbolPath('evita', 'product', 'brand')

describe('execution', () => {
    test('Should open the catalog tabs', () => {
        const workspace: RecordingWorkspace = new RecordingWorkspace()
        workspace.executor.execute(SymbolActionType.CatalogPreview, catalog(), allApis)
        workspace.executor.execute(SymbolActionType.EvitaQLConsole, catalog(), allApis)
        workspace.executor.execute(SymbolActionType.GraphQLDataConsole, catalog(), allApis)
        workspace.executor.execute(SymbolActionType.GraphQLSchemaConsole, catalog(), allApis)
        workspace.executor.execute(SymbolActionType.RestConsole, catalog(), allApis)

        expect(workspace.opened).toEqual([
            ['catalogViewer', 'evita'],
            ['evitaQLConsole', 'evita'],
            ['graphQLConsole', 'evita', GraphQLInstanceType.Data],
            ['graphQLConsole', 'evita', GraphQLInstanceType.Schema],
            ['restConsole', 'evita', RestInstanceType.Catalog]
        ])
    })

    test('Should open the entity viewer with immediate execution', () => {
        const workspace: RecordingWorkspace = new RecordingWorkspace()
        workspace.executor.execute(
            SymbolActionType.EntityViewer,
            new SchemaSymbol(SymbolType.EntityCollection, 'product', new SymbolPath('evita')),
            allApis
        )
        expect(workspace.opened).toEqual([['entityViewer', 'evita', 'product', undefined, true]])
    })

    test('Should open the schema of every symbol type with the matching pointer', () => {
        const workspace: RecordingWorkspace = new RecordingWorkspace()
        const open = (symbol: SchemaSymbol): SchemaPointer => {
            workspace.executor.execute(SymbolActionType.Schema, symbol, allApis)
            return workspace.lastSchemaPointer
        }

        expect(open(catalog())).toEqual(new CatalogSchemaPointer('evita'))
        expect(open(new SchemaSymbol(SymbolType.EntityCollection, 'product', new SymbolPath('evita'))))
            .toEqual(new EntitySchemaPointer('evita', 'product'))
        expect(open(new SchemaSymbol(SymbolType.Attribute, 'code', new SymbolPath('evita'), AttributeOwner.Catalog)))
            .toEqual(new CatalogAttributeSchemaPointer('evita', 'code'))
        expect(open(new SchemaSymbol(SymbolType.Attribute, 'code', productPath, AttributeOwner.Entity)))
            .toEqual(new EntityAttributeSchemaPointer('evita', 'product', 'code'))
        expect(open(new SchemaSymbol(SymbolType.Attribute, 'order', brandReferencePath, AttributeOwner.Reference)))
            .toEqual(new ReferenceAttributeSchemaPointer('evita', 'product', 'brand', 'order'))
        expect(open(new SchemaSymbol(SymbolType.SortableAttributeCompound, 'codeAndName', productPath, AttributeOwner.Entity)))
            .toEqual(new SortableAttributeCompoundSchemaPointer('evita', 'product', 'codeAndName'))
        expect(open(new SchemaSymbol(SymbolType.AssociatedData, 'gallery', productPath)))
            .toEqual(new AssociatedDataSchemaPointer('evita', 'product', 'gallery'))
        expect(open(new SchemaSymbol(SymbolType.Reference, 'brand', productPath)))
            .toEqual(new ReferenceSchemaPointer('evita', 'product', 'brand'))
    })

    test('Should open the owning reference schema for a reference-level compound', () => {
        const workspace: RecordingWorkspace = new RecordingWorkspace()
        workspace.executor.execute(
            SymbolActionType.Schema,
            new SchemaSymbol(SymbolType.SortableAttributeCompound, 'orderAndName', brandReferencePath, AttributeOwner.Reference),
            allApis
        )
        expect(workspace.lastSchemaPointer).toEqual(new ReferenceSchemaPointer('evita', 'product', 'brand'))
    })

    test('Should refuse to execute a disabled action', () => {
        const workspace: RecordingWorkspace = new RecordingWorkspace()
        workspace.executor.execute(SymbolActionType.EvitaQLConsole, catalog(CatalogState.Inactive), allApis)
        expect(workspace.opened).toEqual([])
    })
})

describe('enablement', () => {
    const executor: SymbolActionExecutor = new RecordingWorkspace().executor

    test('Should enable everything for an alive catalog with all web APIs', () => {
        for (const action of Object.values(SymbolActionType)) {
            expect(executor.getDisabledReason(action, catalog(), allApis)).toBeUndefined()
        }
    })

    test('Should disable GraphQL consoles when the API is not enabled', () => {
        expect(executor.getDisabledReason(SymbolActionType.GraphQLDataConsole, catalog(), noApis))
            .toBe(SymbolActionDisabledReason.GraphQLDisabled)
        expect(executor.getDisabledReason(SymbolActionType.GraphQLSchemaConsole, catalog(), noApis))
            .toBe(SymbolActionDisabledReason.GraphQLDisabled)
        expect(executor.getDisabledReason(SymbolActionType.EvitaQLConsole, catalog(), noApis)).toBeUndefined()
    })

    test('Should disable the REST console when the API is not enabled', () => {
        expect(executor.getDisabledReason(SymbolActionType.RestConsole, catalog(), new EnabledApis(true, false)))
            .toBe(SymbolActionDisabledReason.RestDisabled)
        expect(executor.getDisabledReason(SymbolActionType.GraphQLDataConsole, catalog(), new EnabledApis(true, false)))
            .toBeUndefined()
        expect(executor.getDisabledReason(SymbolActionType.RestConsole, catalog(), new EnabledApis(false, true)))
            .toBeUndefined()
    })

    test('Should keep only the preview enabled for a corrupted catalog', () => {
        const corrupted: SchemaSymbol = catalog(CatalogState.Corrupted, true)
        expect(executor.getDisabledReason(SymbolActionType.CatalogPreview, corrupted, allApis)).toBeUndefined()
        expect(executor.getDisabledReason(SymbolActionType.Schema, corrupted, allApis))
            .toBe(SymbolActionDisabledReason.CatalogUnusable)
        expect(executor.getDisabledReason(SymbolActionType.EvitaQLConsole, corrupted, allApis))
            .toBe(SymbolActionDisabledReason.CatalogUnusable)
    })

    test('Should disable every action of a deactivated catalog', () => {
        const inactive: SchemaSymbol = catalog(CatalogState.Inactive)
        expect(executor.getDisabledReason(SymbolActionType.CatalogPreview, inactive, allApis))
            .toBe(SymbolActionDisabledReason.CatalogInactive)
        expect(executor.getDisabledReason(SymbolActionType.Schema, inactive, allApis))
            .toBe(SymbolActionDisabledReason.CatalogNotAlive)
    })

    test('Should mirror the explorer menu for a warming-up catalog', () => {
        const warmingUp: SchemaSymbol = catalog(CatalogState.WarmingUp)
        expect(executor.getDisabledReason(SymbolActionType.CatalogPreview, warmingUp, allApis)).toBeUndefined()
        expect(executor.getDisabledReason(SymbolActionType.EvitaQLConsole, warmingUp, allApis))
            .toBe(SymbolActionDisabledReason.CatalogNotAlive)
    })

    test('Should always enable actions of symbols inside a catalog', () => {
        const collection: SchemaSymbol = new SchemaSymbol(SymbolType.EntityCollection, 'product', new SymbolPath('evita'))
        expect(executor.getDisabledReason(SymbolActionType.EntityViewer, collection, noApis)).toBeUndefined()
        expect(executor.getDisabledReason(SymbolActionType.Schema, collection, noApis)).toBeUndefined()
    })
})
