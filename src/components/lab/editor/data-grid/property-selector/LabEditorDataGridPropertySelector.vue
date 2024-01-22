<script setup lang="ts">
/**
 * Manages selected entity properties that will be fetched into grid.
 */

import { computed, ref } from 'vue'
import {
    EntityPropertyDescriptor, entityPropertyDescriptorIndexKey,
    EntityPropertyKey,
    EntityPropertySectionSelection,
    EntityPropertyType, gridParamsKey,
    parentEntityPropertyType
} from '@/model/editor/data-grid'
import VCardTitleWithActions from '@/components/base/VCardTitleWithActions.vue'
import LabEditorDataGridPropertySelectorSection from './LabEditorDataGridPropertySelectorSection.vue'
import LabEditorDataGridPropertySelectorSectionAttributeItem
    from './LabEditorDataGridPropertySelectorSectionAttributeItem.vue'
import LabEditorDataGridPropertySelectorSectionAssociatedDataItem
    from './LabEditorDataGridPropertySelectorSectionAssociatedDataItem.vue'
import LabEditorDataGridPropertySelectorSectionEntityItem
    from './LabEditorDataGridPropertySelectorSectionEntityItem.vue'
import LabEditorDataGridPropertySelectorSectionReferenceItem
    from './LabEditorDataGridPropertySelectorSectionReferenceItem.vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { UnexpectedError } from '@/model/lab'
import Hotkeys from 'vue-hotkeys-rt/Hotkeys.vue'
import VListItemDivider from '@/components/base/VListItemDivider.vue'
import LabEditorDataGridPropertySelectorSectionReferenceAttributeItem
    from '@/components/lab/editor/data-grid/property-selector/LabEditorDataGridPropertySelectorSectionReferenceAttributeItem.vue'
import LabEditorDataGridPropertySelectorSectionItemGroup
    from '@/components/lab/editor/data-grid/property-selector/LabEditorDataGridPropertySelectorSectionItemGroup.vue'
import LabEditorDataGridPropertySelectorSectionPricesItem
    from '@/components/lab/editor/data-grid/property-selector/LabEditorDataGridPropertySelectorSectionPricesItem.vue'
import { mandatoryInject } from '@/helpers/reactivity'

const topLevelSections: EntityPropertyType[] = [
    EntityPropertyType.Entity,
    EntityPropertyType.Attributes,
    EntityPropertyType.AssociatedData,
    EntityPropertyType.Prices,
    EntityPropertyType.References,
]

const toaster: Toaster = useToaster()

const props = defineProps<{
    modelValue: boolean,
    selected: EntityPropertyKey[],
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update:selected', value: EntityPropertyKey[]): void
    (e: 'schemaOpen'): void
}>()
const gridParams = mandatoryInject(gridParamsKey)
const entityPropertyDescriptorIndex = mandatoryInject(entityPropertyDescriptorIndexKey)

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
        toaster.error(new UnexpectedError(gridParams.dataPointer.connection, 'Cannot select `Some` properties in a section.'))
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

</script>

<template>
    <VDialog
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
                <VTooltip activator="parent">
                    Select displayed properties
                </VTooltip>
            </VBtn>
        </template>

        <VCard class="py-8 px-4">
            <VCardTitleWithActions>
                <template #default>
                    Displayed properties
                </template>
                <template #actions>
                    <VBtn
                        icon
                        variant="flat"
                        density="compact"
                        @click="emit('update:modelValue', false)"
                    >
                        <VIcon>mdi-close</VIcon>
                        <VTooltip activator="parent">
                            Close selector
                        </VTooltip>
                    </VBtn>
                </template>
            </VCardTitleWithActions>
            <VCardText class="selector-body pt-0 pl-4 mt-4">
                <Hotkeys
                    :shortcuts="['F']"
                    @triggered="filterInput?.select()"
                />
                <VTextField
                    ref="filterInput"
                    :model-value="filter"
                    label="Filter properties"
                    variant="solo-filled"
                    density="compact"
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
                    <LabEditorDataGridPropertySelectorSection
                        title="Entity"
                        :property-type="EntityPropertyType.Entity"
                        :selected="sectionedSelected.get(EntityPropertyType.Entity) || []"
                        :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.Entity) || []"
                        :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.Entity) || []"
                        :selection="propertySectionSelections.get(EntityPropertyType.Entity) || EntityPropertySectionSelection.None"
                        @toggle="togglePropertySectionSelection(EntityPropertyType.Entity, $event)"
                    >
                        <template #default="{ property }">
                            <LabEditorDataGridPropertySelectorSectionEntityItem
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />
                        </template>
                    </LabEditorDataGridPropertySelectorSection>
                    <VListItemDivider />
                    <LabEditorDataGridPropertySelectorSection
                        title="Attributes"
                        :property-type="EntityPropertyType.Attributes"
                        :selected="sectionedSelected.get(EntityPropertyType.Attributes) || []"
                        :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.Attributes) || []"
                        :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.Attributes) || []"
                        :selection="propertySectionSelections.get(EntityPropertyType.Attributes) || EntityPropertySectionSelection.None"
                        @toggle="togglePropertySectionSelection(EntityPropertyType.Attributes, $event)"
                    >
                        <template #default="{ property }">
                            <LabEditorDataGridPropertySelectorSectionAttributeItem
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />
                        </template>
                    </LabEditorDataGridPropertySelectorSection>
                    <VListItemDivider />
                    <LabEditorDataGridPropertySelectorSection
                        title="Associated data"
                        :property-type="EntityPropertyType.AssociatedData"
                        :selected="sectionedSelected.get(EntityPropertyType.AssociatedData) || []"
                        :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.AssociatedData) || []"
                        :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.AssociatedData) || []"
                        :selection="propertySectionSelections.get(EntityPropertyType.AssociatedData) || EntityPropertySectionSelection.None"
                        @toggle="togglePropertySectionSelection(EntityPropertyType.AssociatedData, $event)"
                    >
                        <template #default="{ property }">
                            <LabEditorDataGridPropertySelectorSectionAssociatedDataItem
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />
                        </template>
                    </LabEditorDataGridPropertySelectorSection>
                    <template v-if="(sectionedPropertyDescriptors.get(EntityPropertyType.Prices)?.length || 0) > 0 && (filteredSectionedPropertyDescriptors.get(EntityPropertyType.Prices)?.length || 0) > 0">
                        <VListItemDivider />
                        <LabEditorDataGridPropertySelectorSectionPricesItem
                            :property-descriptor="sectionedPropertyDescriptors.get(EntityPropertyType.Prices)![0]"
                        />
                    </template>
                    <VListItemDivider />
                    <LabEditorDataGridPropertySelectorSection
                        title="References"
                        :property-type="EntityPropertyType.References"
                        :selected="sectionedSelected.get(EntityPropertyType.References) || []"
                        :filtered-property-descriptors="filteredSectionedPropertyDescriptors.get(EntityPropertyType.References) || []"
                        :property-descriptors="sectionedPropertyDescriptors.get(EntityPropertyType.References) || []"
                        :selection="propertySectionSelections.get(EntityPropertyType.References) || EntityPropertySectionSelection.None"
                        @toggle="togglePropertySectionSelection(EntityPropertyType.References, $event)"
                    >
                        <template #default="{ property }">
                            <LabEditorDataGridPropertySelectorSectionReferenceItem
                                v-if="property.children.length === 0"
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />

                            <LabEditorDataGridPropertySelectorSectionItemGroup
                                v-else
                                :filtered-property-descriptors="property.children"
                                :property-descriptors="property.children"
                            >
                                <template #activator="{ props }">
                                    <LabEditorDataGridPropertySelectorSectionReferenceItem
                                        :property-descriptor="property"
                                        v-bind="props"
                                        group-parent
                                        @toggle="togglePropertySelection(property.key)"
                                        @schema-open="emit('schemaOpen')"
                                    />
                                </template>

                                <template #child="{ childProperty }">
                                    <LabEditorDataGridPropertySelectorSectionReferenceAttributeItem
                                        :reference-property-descriptor="property"
                                        :attribute-property-descriptor="childProperty"
                                        @toggle="toggleReferenceAttributeProperty(property, $event.selected)"
                                    />
                                </template>
                            </LabEditorDataGridPropertySelectorSectionItemGroup>
                        </template>
                    </LabEditorDataGridPropertySelectorSection>
                </VList>
            </VCardText>
        </VCard>
    </VDialog>
</template>

<style lang="scss" scoped>
.selector-body {
    position: relative;
}

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
