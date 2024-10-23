<script setup lang="ts">
/**
 * Ancestor for selectable entity property items.
 */

import { useI18n } from 'vue-i18n'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { List } from 'immutable'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    value: EntityPropertyKey,
    title: string,
    description?: string,
    flags?: List<string>,
    /**
     * Whether this item has openable detail.
     */
    openable: boolean,
    /**
     * Whether this item is a parent of a group of items, and thus, opens a group of children.
     */
    groupParent?: boolean
}>(), {
    description: undefined,
    openable: false,
    groupParent: false,
    flags: () => List()
})
const emit = defineEmits<{
    (e: 'toggle', value: { key: EntityPropertyKey, selected: boolean }): void
    (e: 'schemaOpen'): void
}>()

</script>

<template>
    <VListItem :value="value">
        <template v-slot:prepend="{ isSelected }">
            <VListItemAction start>
                <VCheckboxBtn
                    :model-value="isSelected"
                    @click.passive="emit('toggle', { key: value, selected: isSelected })"
                />
            </VListItemAction>
        </template>

        <template #title>
            <div class="item-title">
                <span> {{ title }}</span>

                <VChipGroup v-if="flags">
                    <VChip
                        v-for="flag in flags"
                        :key="flag"
                    >
                        {{ flag.startsWith('_') ? t(`schemaViewer.section.flag.${flag.substring(1)}`) : flag }}
                    </VChip>
                </VChipGroup>
            </div>
        </template>

        <template
            v-if="description || false"
            #subtitle
        >
             <div class="item-description">
                {{ description }}
                 <VTooltip
                     activator="parent"
                     max-width="500"
                 >
                     <VMarkdown :source="description" />
                 </VTooltip>
             </div>
        </template>

        <template
            v-if="openable"
            #append="{ isActive }"
        >
            <VBtn
                icon
                variant="text"
                @click.stop="emit('schemaOpen')"
            >
                <VIcon>mdi-open-in-new</VIcon>
                <VTooltip activator="parent">
                    {{ t('entityViewer.propertySelector.section.button.openSchema') }}
                </VTooltip>
            </VBtn>
            <VIcon
                v-if="groupParent"
                class="item-group-parent-chevron--with-actions"
            >
                {{ isActive ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </VIcon>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>
.item-title {
    display: flex;
    gap: 1rem;
    align-items: center;
    height: 1.875rem; // derived from chip group height
}

.item-description {
    margin-top: 0.25rem; // derived from chip group margin
}

.item-group-parent-chevron--with-actions {
    margin-inline-start: 0.5rem
}
</style>
