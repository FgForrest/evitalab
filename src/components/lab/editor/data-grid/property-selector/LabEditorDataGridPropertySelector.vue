<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    EntityPropertyDescriptor,
    EntityPropertyKey,
    EntityPropertyType,
    EntityPropertySectionSelection, DataGridConsoleParams, DataGridConsoleData
} from '@/model/editor/data-grid'
import VCardTitleWithActions from '@/components/base/VCardTitleWithActions.vue'
import LabEditorDataGridPropertySelectorSection from './LabEditorDataGridPropertySelectorSection.vue'
import LabEditorDataGridPropertySelectorSectionAttributeItem from './LabEditorDataGridPropertySelectorSectionAttributeItem.vue'
import LabEditorDataGridPropertySelectorSectionAssociatedDataItem from './LabEditorDataGridPropertySelectorSectionAssociatedDataItem.vue'
import LabEditorDataGridPropertySelectorSectionEntityItem from './LabEditorDataGridPropertySelectorSectionEntityItem.vue'
import LabEditorDataGridPropertySelectorSectionReferenceItem from './LabEditorDataGridPropertySelectorSectionReferenceItem.vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { UnexpectedError } from '@/model/lab'
import { TabComponentProps } from '@/model/editor/editor'
import Hotkeys from 'vue-hotkeys-rt/Hotkeys.vue'
import VListItemDivider from '@/components/base/VListItemDivider.vue'

const toaster: Toaster = useToaster()

const props = defineProps<{
    gridProps: TabComponentProps<DataGridConsoleParams, DataGridConsoleData>,
    modelValue: boolean,
    selected: EntityPropertyKey[],
    propertyDescriptors: EntityPropertyDescriptor[],
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update:selected', value: EntityPropertyKey[]): void
    (e: 'schemaOpen'): void
}>()

const filter = ref<string>('')
const filterInput = ref<HTMLInputElement | null>(null)

/**
 * Index of all properties by property type
 */
const sectionedPropertyDescriptors = computed<Map<EntityPropertyType, EntityPropertyDescriptor[]>>(() => {
    const propertyDescriptors: Map<EntityPropertyType, EntityPropertyDescriptor[]> = new Map<EntityPropertyType, EntityPropertyDescriptor[]>()

    props.propertyDescriptors.forEach(property => {
        if (!propertyDescriptors.has(property.type)) {
            propertyDescriptors.set(property.type, [])
        }

        propertyDescriptors.get(property.type)?.push(property)
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
            return property.title.toLowerCase().includes(filter.value)
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
        const newSelected: EntityPropertyKey[] = props.selected.filter(key => key.type !== sectionType)
        emit('update:selected', newSelected)
    } else if (newSelection === EntityPropertySectionSelection.All) {
        // remove all properties in passed section
        const sectionPropertyKeys: EntityPropertyKey[] = sectionedPropertyDescriptors.value.get(sectionType)?.map(property => property.key) || []
        // select all properties in passed section
        const newSelected: EntityPropertyKey[] = props.selected.filter(key => key.type !== sectionType)
        newSelected.push(...sectionPropertyKeys)

        emit('update:selected', newSelected)
    } else {
        toaster.error(new UnexpectedError(props.gridProps.params.dataPointer.connection, 'Cannot select `Some` properties in a section.'))
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
                        :grid-props="gridProps"
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
                                :grid-props="gridProps"
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />
                        </template>
                    </LabEditorDataGridPropertySelectorSection>
                    <VListItemDivider />
                    <LabEditorDataGridPropertySelectorSection
                        :grid-props="gridProps"
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
                                :grid-props="gridProps"
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />
                        </template>
                    </LabEditorDataGridPropertySelectorSection>
                    <VListItemDivider />
                    <LabEditorDataGridPropertySelectorSection
                        :grid-props="gridProps"
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
                                :grid-props="gridProps"
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />
                        </template>
                    </LabEditorDataGridPropertySelectorSection>
                    <VListItemDivider />
                    <LabEditorDataGridPropertySelectorSection
                        :grid-props="gridProps"
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
                                :grid-props="gridProps"
                                :property-descriptor="property"
                                @schema-open="emit('schemaOpen')"
                            />
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
