<script setup lang="ts">
/**
 * A single selectable section of selectable entity properties to fetch in grid.
 * The entire section can be selected as well.
 */

import { useI18n } from 'vue-i18n'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertySectionSelection } from '@/modules/entity-viewer/viewer/model/EntityPropertySectionSelection'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import PropertySectionEmptyItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionEmptyItem.vue'

const { t } = useI18n()

const props = defineProps<{
    propertyType: EntityPropertyType,
    selected: EntityPropertyKey[],
    filteredPropertyDescriptors: EntityPropertyDescriptor[],
    propertyDescriptors: EntityPropertyDescriptor[],
    selection: EntityPropertySectionSelection
}>()
const emit = defineEmits<{
    (e: 'toggle', value: EntityPropertySectionSelection): void
}>()

function resolveNewSelection() {
    if (props.selection !== EntityPropertySectionSelection.None) {
        emit('toggle', EntityPropertySectionSelection.None)
    } else {
        emit('toggle', EntityPropertySectionSelection.All)
    }
}

</script>

<template>
    <VListGroup
        v-if="propertyDescriptors.length > 0"
        :value="propertyType"
    >
        <template #activator="{ props }">
            <VListItem v-bind="props">
                <template v-slot:prepend>
                    <VListItemAction start>
                        <VBtn
                            icon
                            variant="text"
                            @click.stop="resolveNewSelection"
                        >
                            <VIcon
                                v-if="selection === EntityPropertySectionSelection.None"
                                class="partial-selection"
                            >
                                mdi-checkbox-blank-outline
                            </VIcon>
                            <VIcon
                                v-else-if="selection === EntityPropertySectionSelection.Some"
                                class="partial-selection"
                            >
                                mdi-minus-box
                            </VIcon>
                            <VIcon v-else-if="selection === EntityPropertySectionSelection.All">mdi-checkbox-marked</VIcon>
                        </VBtn>
                    </VListItemAction>
                </template>

                <template #title>
                    {{ t(`entityViewer.propertySelector.section.type.${propertyType || 'entity'}`) }} ({{ selected.length || 0 }}/{{ propertyDescriptors.length }})
                </template>
            </VListItem>
        </template>

        <template v-if="filteredPropertyDescriptors.length > 0">
            <template
                v-for="(property, index) in filteredPropertyDescriptors"
                :key="property.key.toString()"
            >
                <slot :property="property" />
                <VListItemDivider
                    v-if="index < filteredPropertyDescriptors.length - 1"
                    inset
                />
            </template>
        </template>
        <template v-else>
            <PropertySectionEmptyItem />
        </template>
    </VListGroup>
</template>

<style lang="scss" scoped>
.partial-selection {
    opacity: var(--v-medium-emphasis-opacity);
}
</style>
