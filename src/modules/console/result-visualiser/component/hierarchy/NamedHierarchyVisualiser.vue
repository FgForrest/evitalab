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

const props = defineProps<{
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
                        <span>{{ namedHierarchyEntry.name }}</span>

                        <VLazy>
                            <VChipGroup>
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
// todo lho better handling for small widths
.named-hierarchy-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
</style>
