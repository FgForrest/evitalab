<script setup lang="ts">
/**
 * Visualises a single named hierarchy with node count, requested node info, and expandable tree.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { VisualisedNamedHierarchyEntry } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyResult'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import HierarchyTreeNode from '@/modules/console/result-visualiser/component/hierarchy/HierarchyTreeNode.vue'

const namedHierarchyTreesPageSize: number = 10

const { t } = useI18n()

defineProps<{
    namedHierarchyEntry: VisualisedNamedHierarchyEntry
}>()

const namedHierarchyTreesPage = ref<number>(1)

const initialized = ref<boolean>(false)
function initialize(): void {
    initialized.value = !initialized.value
}

</script>

<template>
    <VListGroup>
        <template #activator="{ props }">
            <VListItem v-bind="props" @click="initialize">
                <template #prepend>
                    <VIcon>mdi-file-tree</VIcon>
                </template>
                <template #title>
                    <VListItemTitle class="named-hierarchy-title">
                        <span class="named-hierarchy-title__name">{{ namedHierarchyEntry.name }}</span>

                        <VLazy class="named-hierarchy-title__chips">
                            <VChipGroup column>
                                <VChip prepend-icon="mdi-file-tree">
                                    <span>
                                        {{ namedHierarchyEntry.hierarchy.count }}
                                        <VTooltip activator="parent">
                                            <span>{{ t('resultVisualizer.hierarchyVisualiser.help.nodeCountProperty') }}</span>
                                        </VTooltip>
                                    </span>
                                </VChip>

                                <VChip v-if="namedHierarchyEntry.hierarchy.requestedNode" prepend-icon="mdi-target">
                                    {{ namedHierarchyEntry.hierarchy.requestedNode?.primaryKey != undefined ? `${namedHierarchyEntry.hierarchy.requestedNode?.primaryKey}: ` : '' }}
                                    {{ namedHierarchyEntry.hierarchy.requestedNode?.title }}
                                    <VTooltip activator="parent">
                                        <VMarkdown :source="t('resultVisualizer.hierarchyVisualiser.help.requestedNode')" />
                                    </VTooltip>
                                </VChip>
                            </VChipGroup>
                        </VLazy>
                    </VListItemTitle>
                </template>
            </VListItem>
        </template>

        <template v-if="initialized && namedHierarchyEntry.hierarchy">
            <VListItemLazyIterator
                :items="namedHierarchyEntry.hierarchy.trees"
                v-model:page="namedHierarchyTreesPage"
                :page-size="namedHierarchyTreesPageSize"
            >
                <template #item="{ item: tree }">
                    <HierarchyTreeNode
                        :node="tree"
                    />
                </template>
            </VListItemLazyIterator>
        </template>
    </VListGroup>
</template>

<style lang="scss" scoped>
.named-hierarchy-title {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
    align-items: center;

    // `display: flex` here voids the ellipsis Vuetify puts on `.v-list-item-title`, so the name
    // truncates on its own; `min-width` must be reset because the automatic minimum size of a flex item
    // is its content, which would clip the text instead of shortening it
    &__name {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    // the chips keep their width and move to a line of their own instead of being cut; `column` wraps
    // them there rather than letting them slide out of sight in the group's scrollbar-less scroller
    &__chips {
        flex: 0 0 auto;
        max-width: 100%;

        // `column` also sets `white-space: normal` on the group: without this, a chip's own label wraps
        // and is cut by the chip's height, and the shrinking chips - not the group - absorb the squeeze
        :deep(.v-chip) {
            flex: 0 0 auto;
            white-space: nowrap;
        }
    }
}
</style>
