<script setup lang="ts">
/**
 * Manages selected entity properties that will be fetched into grid.
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertySectionSelection } from '@/modules/entity-viewer/viewer/model/EntityPropertySectionSelection'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Command } from '@/modules/keymap/model/Command'
import { propertySelectorScope } from '@/modules/entity-viewer/viewer/keymap/scopes'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import PropertySection from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySection.vue'
import PropertySectionEntityItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionEntityItem.vue'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import PropertySectionAttributeItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionAttributeItem.vue'
import PropertySectionAssociatedDataItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionAssociatedDataItem.vue'
import PropertySectionPricesItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionPricesItem.vue'
import PropertySectionReferenceItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionReferenceItem.vue'
import PropertySectionItemGroup
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionItemGroup.vue'
import PropertySectionReferenceAttributeItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionReferenceAttributeItem.vue'
import {
    parentEntityPropertyType,
    useEntityPropertyDescriptorIndex,
    useTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'

const topLevelSections: EntityPropertyType[] = [
    EntityPropertyType.Entity,
    EntityPropertyType.Attributes,
    EntityPropertyType.AssociatedData,
    EntityPropertyType.Prices,
    EntityPropertyType.References,
]

const keymap: Keymap = useKeymap()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    selected: EntityPropertyKey[]
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update:selected', value: EntityPropertyKey[]): void
    (e: 'schemaOpen'): void
}>()
const tabProps = useTabProps()
const entityPropertyDescriptorIndex = useEntityPropertyDescriptorIndex()

const filter = ref<string>('')
const filterInput = ref<HTMLInputElement | null>(null)

/**
 * Index of all properties by property type
 */
const sectionedPropertyDescriptors = computed<Map<EntityPropertyType, EntityPropertyDescriptor[]>>(() => {
    const propertyDescriptors: Map<EntityPropertyType, EntityPropertyDescriptor[]> = new Map<EntityPropertyType, EntityPropertyDescriptor[]>()

    entityPropertyDescriptorIndex.value.forEach(propertyDescriptor => {
        if (!topLevelSections.includes(propertyDescriptor.type)) {
            return
        }

        if (!propertyDescriptors.has(propertyDescriptor.type)) {
            propertyDescriptors.set(propertyDescriptor.type, [])
        }

        propertyDescriptors.get(propertyDescriptor.type)?.push(propertyDescriptor)
    })

    return propertyDescriptors
})
/**
 * Index of properties by property type matching the filter
 */
const filteredSectionedPropertyDescriptors = computed<Map<EntityPropertyType, EntityPropertyDescriptor[]>>(() => {
    const properties: Map<EntityPropertyType, EntityPropertyDescriptor[]> = new Map<EntityPropertyType, EntityPropertyDescriptor[]>()

    for (const [sectionType, sectionProperties] of sectionedPropertyDescriptors.value) {
        const filteredSectionProperties: EntityPropertyDescriptor[] = sectionProperties.filter(property => {
            return property.title.toLowerCase().includes(filter.value) ||
                property.children.find(child => child.title.toLowerCase().includes(filter.value)) != undefined
        })
        properties.set(sectionType, filteredSectionProperties)
    }

    return properties
})

/**
 * Index of selected properties by property type
 */
const sectionedSelected = computed<Map<EntityPropertyType, EntityPropertyKey[]>>(() => {
    const keys: Map<EntityPropertyType, EntityPropertyKey[]> = new Map<EntityPropertyType, EntityPropertyKey[]>()

    props.selected.forEach(key => {
        if (!keys.has(key.type)) {
            keys.set(key.type, [])
        }
        keys.get(key.type)?.push(key)
    })
    return keys
})
/**
 * Index of property section selection by property type
 */
const propertySectionSelections = computed<Map<EntityPropertyType, EntityPropertySectionSelection>>(() => {
    const selections: Map<EntityPropertyType, EntityPropertySectionSelection> = new Map<EntityPropertyType, EntityPropertySectionSelection>()

    for (const [sectionType, selectedKeys] of sectionedSelected.value) {
        let selection: EntityPropertySectionSelection
        if (selectedKeys.length === 0) {
            selection = EntityPropertySectionSelection.None
        } else if (selectedKeys.length === sectionedPropertyDescriptors.value.get(sectionType)?.length) {
            selection = EntityPropertySectionSelection.All
        } else {
            selection = EntityPropertySectionSelection.Some
        }
        selections.set(sectionType, selection)
    }

    return selections
})
const openedPropertySections = ref<EntityPropertyType[]>([])

function handleFilterUpdate(term: string): void {
    filter.value = term.toLowerCase()
    if (term.length === 0) {
        openedPropertySections.value = []
    } else {
        // automatically open sections that have any properties matching the filter
        const sectionsWithAnyPropertyDescriptors: EntityPropertyType[] = []
        if (filteredSectionedPropertyDescriptors.value.size > 0) {
            if ((filteredSectionedPropertyDescriptors.value.get(EntityPropertyType.Entity) || []).length > 0) {
                sectionsWithAnyPropertyDescriptors.push(EntityPropertyType.Entity)
            }
            if ((filteredSectionedPropertyDescriptors.value.get(EntityPropertyType.Attributes) || []).length > 0) {
                sectionsWithAnyPropertyDescriptors.push(EntityPropertyType.Attributes)
            }
            if ((filteredSectionedPropertyDescriptors.value.get(EntityPropertyType.AssociatedData) || []).length > 0) {
                sectionsWithAnyPropertyDescriptors.push(EntityPropertyType.AssociatedData)
            }
            if ((filteredSectionedPropertyDescriptors.value.get(EntityPropertyType.References) || []).length > 0) {
                sectionsWithAnyPropertyDescriptors.push(EntityPropertyType.References)
            }
        }
        openedPropertySections.value = sectionsWithAnyPropertyDescriptors
    }
}

/**
 * Either selects all properties in a single section or removes all properties in a single section from the selection.
 */
function togglePropertySectionSelection(sectionType: EntityPropertyType, newSelection: EntityPropertySectionSelection): void {
    if (newSelection === EntityPropertySectionSelection.None) {
        // remove all properties in passed section
        const newSelected: EntityPropertyKey[] = props.selected.filter(key => {
            if (key.type === sectionType) {
                return false
            }
            const parentType = parentEntityPropertyType.get(key.type)
            if (parentType != undefined && parentType === sectionType) {
                return false
            }
            return true
        })
        emit('update:selected', newSelected)
    } else if (newSelection === EntityPropertySectionSelection.All) {
        // select all properties in passed section
        const sectionPropertyKeys: EntityPropertyKey[] = sectionedPropertyDescriptors.value.get(sectionType)
            ?.flatMap(property => [property.key, ...property.children.map(childProperty => childProperty.key)])
            || []
        const newSelected: EntityPropertyKey[] = [...props.selected]
        newSelected.push(...sectionPropertyKeys)

        emit('update:selected', newSelected)
    } else {
        toaster.error(new UnexpectedError(t('entityViewer.propertySelector.notification.invalidPropertySectionSelection')))
    }
}

function togglePropertySelection(propertyKey: EntityPropertyKey): void {
    if (props.selected.find(key => key.toString() === propertyKey.toString())) {
        // remove property from selection
        const newSelected: EntityPropertyKey[] = props.selected.filter(key => {
            if (key.toString() === propertyKey.toString()) {
                return false
            }
            const propertyDescriptor: EntityPropertyDescriptor = entityPropertyDescriptorIndex.value.get(propertyKey.toString())!
            if (propertyDescriptor.children.find(child => key.toString() === child.key.toString()) != undefined) {
                return false
            }
            return true
        })
        emit('update:selected', newSelected)
    } else {
        // add property to selection
        const newSelected: EntityPropertyKey[] = [...props.selected]
        newSelected.push(propertyKey)
        emit('update:selected', newSelected)
    }
}

function toggleReferenceAttributeProperty(referenceProperty: EntityPropertyDescriptor, selected: boolean): void {
    // we are interested only in the parent reference property, because the actual reference attribute properties are
    // toggled automatically by the list item components
    if (!selected) {
        if (props.selected.find(key => key.toString() === referenceProperty.key.toString())) {
            // already selected
            return
        }
        // add reference property to selection because we cannot fetch reference attributes alone without references
        const newSelected: EntityPropertyKey[] = [...props.selected]
        newSelected.push(referenceProperty.key)
        emit('update:selected', newSelected)
    }
}

onMounted(() => {
    // register keyboard shortcuts for property selector
    keymap.bindWithinScope(Command.EntityViewer_PropertySelector_FindProperty, tabProps.id, propertySelectorScope, () => filterInput?.value?.select())
})
onUnmounted(() => {
    // unregister keyboard shortcuts for property selector
    keymap.unbindWithinScope(Command.EntityViewer_PropertySelector_FindProperty, tabProps.id, propertySelectorScope)
})
</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        max-width="60rem"
        scrollable
    >
        <template #activator="{ props }">
            <VBtn
                icon
                density="comfortable"
                v-bind="props"
            >
                <VIcon>mdi-view-column-outline</VIcon>
                <VActionTooltip :command="Command.EntityViewer_OpenPropertySelector">
                    {{ t('entityViewer.propertySelector.button.selectDisplayedProperties') }}
                </VActionTooltip>
            </VBtn>
        </template>

        <template #title>
            {{ t('entityViewer.propertySelector.title') }}
        </template>

        <template #default>
            <VTextField
                ref="filterInput"
                :model-value="filter"
                :label="t('entityViewer.propertySelector.label.filterProperties')"
                autofocus
                :append-inner-icon="filter ? 'mdi-close-circle-outline' : null as any"
                @update:model-value="handleFilterUpdate($event)"
                @click:append-inner="handleFilterUpdate('')"
                class="filter-input"
            />

            <VList
                :selected="selected"
                @update:selected="emit('update:selected', $event as EntityPropertyKey[])"
                v-model:opened="openedPropertySections"
                lines="two"
                open-strategy="multiple"
                select-strategy="classic"
                class="property-list"
            >
                <PropertySection
                    :property-type="EntityPropertyType.Entity"
                    :selected="sectionedSelected.get(EntityPropertyType.Entity) || []"
                    :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.Entity) || []"
                    :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.Entity) || []"
                    :selection="propertySectionSelections.get(EntityPropertyType.Entity) || EntityPropertySectionSelection.None"
                    @toggle="togglePropertySectionSelection(EntityPropertyType.Entity, $event)"
                >
                    <template #default="{ property }">
                        <PropertySectionEntityItem
                            :property-descriptor="property"
                            @schema-open="emit('schemaOpen')"
                        />
                    </template>
                </PropertySection>
                <VListItemDivider />
                <PropertySection
                    :property-type="EntityPropertyType.Attributes"
                    :selected="sectionedSelected.get(EntityPropertyType.Attributes) || []"
                    :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.Attributes) || []"
                    :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.Attributes) || []"
                    :selection="propertySectionSelections.get(EntityPropertyType.Attributes) || EntityPropertySectionSelection.None"
                    @toggle="togglePropertySectionSelection(EntityPropertyType.Attributes, $event)"
                >
                    <template #default="{ property }">
                        <PropertySectionAttributeItem
                            :property-descriptor="property"
                            @schema-open="emit('schemaOpen')"
                        />
                    </template>
                </PropertySection>
                <VListItemDivider />
                <PropertySection
                    :property-type="EntityPropertyType.AssociatedData"
                    :selected="sectionedSelected.get(EntityPropertyType.AssociatedData) || []"
                    :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.AssociatedData) || []"
                    :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.AssociatedData) || []"
                    :selection="propertySectionSelections.get(EntityPropertyType.AssociatedData) || EntityPropertySectionSelection.None"
                    @toggle="togglePropertySectionSelection(EntityPropertyType.AssociatedData, $event)"
                >
                    <template #default="{ property }">
                        <PropertySectionAssociatedDataItem
                            :property-descriptor="property"
                            @schema-open="emit('schemaOpen')"
                        />
                    </template>
                </PropertySection>
                <template v-if="(sectionedPropertyDescriptors.get(EntityPropertyType.Prices)?.length || 0) > 0 && (filteredSectionedPropertyDescriptors.get(EntityPropertyType.Prices)?.length || 0) > 0">
                    <VListItemDivider />
                    <PropertySectionPricesItem
                        :property-descriptor="sectionedPropertyDescriptors.get(EntityPropertyType.Prices)![0]"
                    />
                </template>
                <VListItemDivider />
                <PropertySection
                    :property-type="EntityPropertyType.References"
                    :selected="sectionedSelected.get(EntityPropertyType.References) || []"
                    :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.References) || []"
                    :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.References) || []"
                    :selection="propertySectionSelections.get(EntityPropertyType.References) || EntityPropertySectionSelection.None"
                    @toggle="togglePropertySectionSelection(EntityPropertyType.References, $event)"
                >
                    <template #default="{ property }">
                        <PropertySectionReferenceItem
                            v-if="property.children.size === 0"
                            :property-descriptor="property"
                            @schema-open="emit('schemaOpen')"
                        />

                        <PropertySectionItemGroup
                            v-else
                            :filtered-property-descriptors="property.children"
                            :property-descriptors="property.children"
                        >
                            <template #activator="{ props }">
                                <PropertySectionReferenceItem
                                    :property-descriptor="property"
                                    v-bind="props"
                                    group-parent
                                    @toggle="togglePropertySelection(property.key)"
                                    @schema-open="emit('schemaOpen')"
                                />
                            </template>

                            <template #child="{ childProperty }">
                                <PropertySectionReferenceAttributeItem
                                    :reference-property-descriptor="property"
                                    :attribute-property-descriptor="childProperty"
                                    @toggle="toggleReferenceAttributeProperty(property, $event.selected)"
                                />
                            </template>
                        </PropertySectionItemGroup>
                    </template>
                </PropertySection>
            </VList>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>
.filter-input {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    background: var(--el-color-primary-dark);
    padding: 0 0 12px 0;
    margin-top: -4px;
    z-index: 100;
}
.property-list {
    translate: 0 4px;
    padding: 0 4px;
}
</style>
