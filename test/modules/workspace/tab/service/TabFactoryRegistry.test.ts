import { test, expect, describe } from 'vitest'
import { TabFactoryRegistry } from '@/modules/workspace/tab/service/TabFactoryRegistry'
import type { TabFactory } from '@/modules/workspace/tab/service/TabFactory'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { InitializationError } from '@/modules/base/exception/InitializationError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'

function createFactory(tabType: TabType,
                       legacyTabTypeIds?: readonly string[],
                       restorable: boolean = true): TabFactory {
    return {
        tabType,
        legacyTabTypeIds,
        restorable,
        restoreFromJson: (): AnyTabDefinition => ({ tabType } as unknown as AnyTabDefinition)
    }
}

describe('TabFactoryRegistry', () => {
    test('resolves a factory by its canonical tab type', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()
        const factory: TabFactory = createFactory(TabType.EntityViewer)
        registry.register(factory)

        expect(registry.getFactory(TabType.EntityViewer)).toBe(factory)
    })

    test('resolves a factory by any of its legacy tab type ids', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()
        const factory: TabFactory = createFactory(TabType.EntityViewer, ['data-grid', 'dataGrid'])
        registry.register(factory)

        expect(registry.getFactory('data-grid')).toBe(factory)
        expect(registry.getFactory('dataGrid')).toBe(factory)
    })

    test('rejects a second factory for the same tab type', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()
        registry.register(createFactory(TabType.EntityViewer))

        expect(() => registry.register(createFactory(TabType.EntityViewer)))
            .toThrow(InitializationError)
    })

    test('rejects a legacy tab type id already taken by another factory', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()
        registry.register(createFactory(TabType.EntityViewer, ['data-grid']))

        expect(() => registry.register(createFactory(TabType.SchemaViewer, ['data-grid'])))
            .toThrow(InitializationError)
    })

    test('rejects a legacy tab type id shadowing a canonical tab type', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()

        expect(() => registry.register(createFactory(TabType.EntityViewer, [TabType.SchemaViewer])))
            .toThrow(InitializationError)
    })

    test('reports an unknown tab type id', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()

        expect(() => registry.getFactory('somethingElse')).toThrow(UnexpectedError)
        expect(registry.findFactory('somethingElse')).toBeUndefined()
    })

    test('validation fails as long as some tab type has no factory', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()
        registry.register(createFactory(TabType.EntityViewer))

        expect(() => registry.validate()).toThrow(InitializationError)
        expect(() => registry.validate()).toThrow(new RegExp(TabType.SchemaViewer))
    })

    test('validation passes once every tab type has a factory', () => {
        const registry: TabFactoryRegistry = new TabFactoryRegistry()
        Object.values(TabType).forEach(tabType => registry.register(createFactory(tabType)))

        expect(() => registry.validate()).not.toThrow()
    })
})
