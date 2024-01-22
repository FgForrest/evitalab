<script setup lang="ts">
/**
 * A single selectable subsection of selectable entity properties to fetch in grid where
 * the group is also a selectable entity property.
 */

import { EntityPropertyDescriptor } from '@/model/editor/data-grid'
import VListItemDivider from '@/components/base/VListItemDivider.vue'

const props = defineProps<{
    filteredPropertyDescriptors: EntityPropertyDescriptor[],
    propertyDescriptors: EntityPropertyDescriptor[],
}>()
</script>

<template>
    <VListGroup>
        <template #activator="{ props }">
            <slot name="activator" :props="props" />
        </template>

        <template
            v-for="(propertyDescriptor, index) in filteredPropertyDescriptors"
            :key="propertyDescriptor.key.toString()"
        >
            <slot name="child" :child-property="propertyDescriptor" />
            <VListItemDivider
                v-if="index < filteredPropertyDescriptors.length - 1"
                inset
            />
        </template>
    </VListGroup>
</template>

<style lang="scss" scoped>

</style>
