<script setup lang="ts">
/**
 * Ancestor for selectable entity property items.
 */

import { useI18n } from 'vue-i18n'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { List } from 'immutable'
import type { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    value: EntityPropertyKey,
    title: string,
    description?: string,
    flags?: List<Flag>,
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
                    @update:model-value="emit('toggle', { key: value, selected: isSelected })"
                />
            </VListItemAction>
        </template>

        <template #title>
            <div class="item-title">
                <span> {{ title }}</span>

                <VChipGroup v-if="flags">
                    <VChip
                        v-for="flag in flags"
                        :key="flag.flag"
                    >
                        {{ flag.flag.startsWith('_') ? t(`schemaViewer.section.flag.${flag.flag.substring(1)}`) : flag.flag }}
                        <template #append>
                            <VIcon v-for="(item, index) in flag.icons" :key="index" :class="flag.icons.length - 1 === index && flag.icons.length !== 1 ? 'last-chip-icon' : 'chip-icon'">{{ item }}</VIcon>
                        </template>
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

.chip-icon {
    margin-left: 2px;
    margin-right: 3px;
}

.last-chip-icon {
    margin-right: 8px;
}
</style>
