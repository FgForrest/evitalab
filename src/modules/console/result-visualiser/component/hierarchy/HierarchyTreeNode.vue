<script setup lang="ts">
/**
 * Visualises hierarchy tree node from raw JSON.
 */

import { ref } from 'vue'
import {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'
import HierarchyTreeNodeTitle from '@/modules/console/result-visualiser/component/hierarchy/HierarchyTreeNodeTitle.vue'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'

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
                <HierarchyTreeNodeTitle :node="node" />
            </VListItem>
        </template>

        <VListItemLazyIterator
            :items="node.children"
            v-model:page="nodeChildrenPage"
            :page-size="nodeChildrenPageSize"
        >
            <template #item="{ item: childNode }">
                <HierarchyTreeNode
                    :node="childNode"
                    :entity-representative-attributes="entityRepresentativeAttributes"
                />
            </template>
        </VListItemLazyIterator>
    </VListGroup>
    <VListItem v-else>
        <HierarchyTreeNodeTitle :node="node" />
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
