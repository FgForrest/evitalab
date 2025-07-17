import { provide, inject } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { EntityViewerTabParams } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabParams'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { mandatoryInject } from '@/utils/reactivity'
import { Map as ImmutableMap, List as ImmutableList } from 'immutable'
import type { SelectedLayer } from '@/modules/entity-viewer/viewer/model/SelectedLayer.ts'

/**
 * Dependency injection key for data grid props
 */
const tabPropsInjectionKey: InjectionKey<TabComponentProps<EntityViewerTabParams, EntityViewerTabData>> = Symbol('tabProps')
export const provideTabProps = (tabProps: TabComponentProps<EntityViewerTabParams, EntityViewerTabData>): void => {
    provide(tabPropsInjectionKey, tabProps)
}
export const useTabProps = (): TabComponentProps<EntityViewerTabParams, EntityViewerTabData> => {
    return mandatoryInject(tabPropsInjectionKey)
}

/**
 * Dependency injection key for index of available entity property descriptors
 */
const entityPropertyDescriptorIndexInjectionKey: InjectionKey<Ref<ImmutableMap<string, EntityPropertyDescriptor>>> = Symbol('entityPropertyDescriptorIndex')
export const provideEntityPropertyDescriptorIndex = (entityPropertyDescriptorIndex: Ref<ImmutableMap<string, EntityPropertyDescriptor>>): void => {
    provide(entityPropertyDescriptorIndexInjectionKey, shallowReadonly(entityPropertyDescriptorIndex) as Ref<ImmutableMap<string, EntityPropertyDescriptor>>)
}
export const useEntityPropertyDescriptorIndex = (): Ref<ImmutableMap<string, EntityPropertyDescriptor>> => {
    return mandatoryInject(entityPropertyDescriptorIndexInjectionKey)
}

/**
 * Dependency injection key for selected query language
 */
const queryLanguageInjectionKey: InjectionKey<Ref<QueryLanguage>> = Symbol('queryLanguage')
export const provideQueryLanguage = (queryLanguage: Ref<QueryLanguage>): void => {
    provide(queryLanguageInjectionKey, shallowReadonly(queryLanguage))
}
export const useQueryLanguage = (): Ref<QueryLanguage> => {
    return mandatoryInject(queryLanguageInjectionKey)
}

const layerInjectionKey: InjectionKey<Ref<SelectedLayer[]>> = Symbol('layer')
export const provideLayer = (layer: Ref<SelectedLayer[]>): void => {
    provide(layerInjectionKey, shallowReadonly(layer))
}

export const useLayer = (): Ref<SelectedLayer[]> => {
    return mandatoryInject(layerInjectionKey)
}

/**
 * Dependency injection key for selected data locale
 */
const dataLocaleInjectionKey: InjectionKey<Ref<string | undefined>> = Symbol('dataLocale')
export const provideDataLocale = (dataLocale: Ref<string | undefined>): void => {
    provide(dataLocaleInjectionKey, shallowReadonly(dataLocale))
}
export const useDataLocale = (): Ref<string | undefined> => {
    return mandatoryInject(dataLocaleInjectionKey)
}

/**
 * Dependency injection key for selected price type
 */
const priceTypeInjectionKey: InjectionKey<Ref<QueryPriceMode>> = Symbol('priceType')
export const providePriceType = (priceType: Ref<QueryPriceMode>): void => {
    provide(priceTypeInjectionKey, shallowReadonly(priceType))
}
export const usePriceType = (): Ref<QueryPriceMode> => {
    return mandatoryInject(priceTypeInjectionKey)
}

/**
 * Dependency injection key for used filter
 */
const queryFilterInjectionKey: InjectionKey<Ref<string>> = Symbol('queryFilter')
export const provideQueryFilter = (queryFilter: Ref<string>): void => {
    provide(queryFilterInjectionKey, queryFilter)
}
export const useQueryFilter = (): Ref<string> => {
    return mandatoryInject(queryFilterInjectionKey)
}

/**
 * Dependency injection key for selected entity from the grid
 */
const selectedEntityInjectionKey: InjectionKey<FlatEntity> = Symbol('selectedEntity')
export const provideSelectedEntity = (selectedEntity: FlatEntity): void => {
    provide(selectedEntityInjectionKey, selectedEntity)
}
export const useSelectedEntity = (): FlatEntity => {
    return mandatoryInject(selectedEntityInjectionKey)
}

/**
 * Dependency injection key for single entity property descriptor
 */
const entityPropertyDescriptorInjectionKey: InjectionKey<EntityPropertyDescriptor | undefined> = Symbol('entityPropertyDescriptor')
export const provideEntityPropertyDescriptor = (entityPropertyDescriptor: EntityPropertyDescriptor | undefined): void => {
    provide(entityPropertyDescriptorInjectionKey, entityPropertyDescriptor)
}
export const useEntityPropertyDescriptor = (): EntityPropertyDescriptor | undefined => {
    return inject(entityPropertyDescriptorInjectionKey)
}

/**
 * Defines a parent property type for a given entity property type that cannot be used by itself without its parent.
 * Note: this is a workaround for the fact that we cannot define metadata for individual enum values.
 */
export const parentEntityPropertyType: ImmutableMap<EntityPropertyType, EntityPropertyType> = ImmutableMap([
    [EntityPropertyType.ReferenceAttributes, EntityPropertyType.References]
])

/**
 * List of {@link StaticEntityProperties} that are sortable.
 */
export const sortableStaticEntityProperties: ImmutableList<string> = ImmutableList(StaticEntityProperties.PrimaryKey)

