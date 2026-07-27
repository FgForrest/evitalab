<script setup lang="ts">
/**
 * Renders references grouped by their representative reference attribute values. Each group gets a subheader with
 * the group label and the total item count; a plain flat list is rendered when there are no groups (the single
 * group has an empty label). Items are lazily paged with a "show more" button across all groups. Individual items
 * are rendered through the scoped `item` slot as {@link VExpansionPanel}s.
 */

import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ReferenceGroup } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    groups: ReferenceGroup[],
    pageSize?: number
}>(), {
    pageSize: 10
})

type VisibleGroup = {
    label: string,
    total: number,
    startIndex: number,
    items: EntityReferenceValue[]
}

const page = ref<number>(1)
watch(() => props.groups, () => {
    // reset paging when the (filtered) groups change
    page.value = 1
})

const totalItems = computed<number>(() => props.groups.reduce((sum, group) => sum + group.items.length, 0))
const visibleCount = computed<number>(() => page.value * props.pageSize)
const visibleGroups = computed<VisibleGroup[]>(() => {
    const result: VisibleGroup[] = []
    let remaining: number = visibleCount.value
    let startIndex: number = 0
    for (const group of props.groups) {
        if (remaining <= 0) {
            break
        }
        const take: number = Math.min(remaining, group.items.length)
        result.push({
            label: group.label,
            total: group.items.length,
            startIndex,
            items: group.items.slice(0, take)
        })
        remaining -= take
        startIndex += take
    }
    return result
})
const hasMore = computed<boolean>(() => totalItems.value > visibleCount.value)
</script>

<template>
    <div class="reference-grouped-list">
        <template v-for="(group, groupIndex) in visibleGroups" :key="groupIndex">
            <div v-if="group.label" class="reference-grouped-list__header">
                <span class="reference-grouped-list__header-label">{{ group.label }}</span>
                <span class="text-disabled">({{ group.total }})</span>
            </div>

            <VExpansionPanels multiple class="reference-grouped-list__panels">
                <template
                    v-for="(item, itemIndex) in group.items"
                    :key="group.startIndex + itemIndex"
                >
                    <slot name="item" :item="item" :index="group.startIndex + itemIndex" />
                </template>
            </VExpansionPanels>
        </template>

        <div v-if="hasMore" class="pt-2">
            <VBtn variant="outlined" @click="page++">
                {{ t('common.button.showMore') }}
            </VBtn>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.reference-grouped-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0 0.25rem;
        font-weight: 500;

        &-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    &__panels {
        :deep(.v-expansion-panel-text__wrapper) {
            padding: 0;
        }
    }
}
</style>
