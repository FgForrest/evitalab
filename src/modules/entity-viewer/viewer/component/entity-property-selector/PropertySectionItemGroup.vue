<script setup lang="ts">/**
 * A single selectable subsection of selectable entity properties to fetch in grid where
 * the group is also a selectable entity property.
 */
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import { List } from 'immutable'


const props = defineProps<{
    filteredPropertyDescriptors: List<EntityPropertyDescriptor>,
    propertyDescriptors: List<EntityPropertyDescriptor>,
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
                v-if="index < filteredPropertyDescriptors.size - 1"
                inset
            />
        </template>
    </VListGroup>
</template>

<style lang="scss" scoped>

</style>
