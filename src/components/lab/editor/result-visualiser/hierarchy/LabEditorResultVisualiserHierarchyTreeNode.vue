<script setup lang="ts">
/**
 * Visualises hierarchy tree node from raw JSON.
 */

import LabEditorResultVisualiserHierarchyTreeNodeTitle
    from '@/components/lab/editor/result-visualiser/hierarchy/LabEditorResultVisualiserHierarchyTreeNodeTitle.vue'
import { VisualisedHierarchyTreeNode } from '@/model/editor/result-visualiser'

const props = defineProps<{
    node: VisualisedHierarchyTreeNode,
    entityRepresentativeAttributes: string[]
}>()

</script>

<template>
    <VListGroup v-if="!node.isLeaf()">
        <template #activator="{ props }">
            <VListItem v-bind="props">
                <LabEditorResultVisualiserHierarchyTreeNodeTitle :node="node" />
            </VListItem>
        </template>

        <LabEditorResultVisualiserHierarchyTreeNode
            v-for="(childNode, index) in node.children"
            :key="index"
            :node="childNode"
            :entity-representative-attributes="entityRepresentativeAttributes"
        />
    </VListGroup>
    <VListItem v-else>
        <LabEditorResultVisualiserHierarchyTreeNodeTitle :node="node" />
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
