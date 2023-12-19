<script setup lang="ts">
import { EntityPropertyKey } from '@/model/editor/data-grid'
import VMarkdown from '@/components/base/VMarkdown.vue'

const props = withDefaults(defineProps<{
    value: EntityPropertyKey,
    title: string,
    description?: string,
    flags?: string[],
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
    flags: () => []
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
                        class="text-sm-body-2"
                    >
                        {{ flag }}
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
                    Open schema
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
