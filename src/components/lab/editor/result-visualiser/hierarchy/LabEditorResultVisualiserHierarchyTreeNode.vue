<script setup lang="ts">
/**
 * Visualises hierarchy tree node from raw JSON.
 */

import LabEditorResultVisualiserHierarchyTreeNodeTitle
    from '@/components/lab/editor/result-visualiser/hierarchy/LabEditorResultVisualiserHierarchyTreeNodeTitle.vue'
import { VisualisedHierarchyTreeNode } from '@/model/editor/result-visualiser'
import VListItemLazyIterator from '@/components/base/VListItemLazyIterator.vue'
import { ref } from 'vue'

const nodeChildrenPageSize: number = 10

const props = defineProps<{
    node: VisualisedHierarchyTreeNode,
    entityRepresentativeAttributes: string[]
}>()

const nodeChildrenPage = ref<number>(1)
</script>

<template>
    <VListGroup v-if="!node.isLeaf()">
        <template #activator="{ props }">
            <VListItem v-bind="props">
                <LabEditorResultVisualiserHierarchyTreeNodeTitle :node="node" />
            </VListItem>
        </template>

        <VListItemLazyIterator
            :items="node.children"
            v-model:page="nodeChildrenPage"
            :page-size="nodeChildrenPageSize"
        >
            <template #item="{ item: childNode }">
                <LabEditorResultVisualiserHierarchyTreeNode
                    :node="childNode"
                    :entity-representative-attributes="entityRepresentativeAttributes"
                />
            </template>
        </VListItemLazyIterator>
    </VListGroup>
    <VListItem v-else>
        <LabEditorResultVisualiserHierarchyTreeNodeTitle :node="node" />
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
